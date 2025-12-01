import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVideoService } from '../../common/ai-video.service';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { AssetType } from '../../projects/asset.entity';
import { ProxyService } from '../../common/proxy.service';
import { RenderService } from '../../common/render.service'; // <--- Импортируем Рендер
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';

// Функция паузы (sleep)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Processor('video-generation')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);
  private readonly pollDelayMs: number;
  private readonly maxPollAttempts: number;

  constructor(
    private readonly aiVideoService: AiVideoService,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
    private readonly renderService: RenderService, // <--- Внедряем сервис рендера
  ) {
    this.pollDelayMs =
      this.configService.get<number>('VIDEO_POLL_DELAY_MS') || 10000;
    this.maxPollAttempts =
      this.configService.get<number>('VIDEO_MAX_POLL_ATTEMPTS') || 30;
  }

  // --- ВСПОМОГАТЕЛЬНЫЙ МЕТОД: Удаление фона (Photoroom) ---
  private async removeBackground(imageUrl: string): Promise<Buffer> {
    this.logger.log('🎨 Removing background via Photoroom...');
    const apiKey = this.configService.get<string>('PHOTOROOM_API_KEY');

    // Скачиваем исходник
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const inputBuffer = Buffer.from(imageResponse.data);

    // Если нет ключа — возвращаем оригинал (Mock Mode)
    if (!apiKey || apiKey === 'mock') {
      this.logger.warn('⚠️ Photoroom Mock Mode: Background not removed');
      return inputBuffer;
    }

    const formData = new FormData();
    formData.append('image_file', inputBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('size', 'auto');
    formData.append('format', 'png');

    const response = await this.proxyService.post<Buffer>(
      'https://sdk.photoroom.com/v1/segment',
      formData,
      {
        headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
        responseType: 'arraybuffer',
      },
    );
    return Buffer.from(response);
  }

  // --- ГЛАВНЫЙ ПРОЦЕСС ---
  @Process('generate-kling')
  async handleGenerateKling(job: Job<{ projectId: string }>) {
    const { projectId } = job.data;
    this.logger.log(`🎬 Start Pipeline for Project ${projectId}`);

    try {
      // 1. Получаем данные проекта из БД
      const project = await this.projectsService.findOne(projectId);
      const settings = project.settings || {};
      const imageUrl = settings.mainImage;

      if (!imageUrl) throw new Error('No main image found in project');

      // 2. Параллельный запуск: Генерация видео + Удаление фона
      this.logger.log('⚡ Starting parallel tasks: Kling AI + Photoroom');

      const [klingVideoUrl, cutoutBuffer] = await Promise.all([
        this.generateKlingVideo(
          imageUrl,
          // 👇 Если промпта нет, ставим дефолтный "красивый"
          settings.prompt ||
            'Cinematic product shot, high quality, 4k, slow motion',
        ),
        this.removeBackground(imageUrl),
      ]);

      // 3. Сохраняем вырезанное фото в S3 (для рендера)
      const cutoutUrl = await this.storageService.uploadFile(
        cutoutBuffer,
        'image/png',
        'processed',
      );
      this.logger.log(`✅ Cutout saved: ${cutoutUrl}`);

      // 4. Подготовка данных для Рендера
      const inputProps = {
        title: settings.productName || project.title || 'Новинка',
        // ВАЖНО: Передаем в шаблон и оригинал (для фона), и вырезанный (для переднего плана)
        // Но пока наш шаблон WbClassic поддерживает только mainImage.
        // Давай передадим cutoutUrl как mainImage, чтобы товар был на прозрачном фоне?
        // Или лучше обновим шаблон.
        // ДЛЯ СЕЙЧАС: Передаем cutoutUrl как mainImage, так будет красивее на размытом фоне.
        mainImage: cutoutUrl,

        usps:
          settings.usps && settings.usps.length > 0
            ? settings.usps
            : ['Быстрая доставка', 'Отличное качество', 'Хит продаж'],
        primaryColor: '#4f46e5',
      };

      // 5. ЗАПУСК РЕНДЕРА
      this.logger.log('🔥 Rendering final video with Remotion...');
      const outputFilePath = await this.renderService.renderVideo(inputProps);

      this.logger.log(`✅ Render finished: ${outputFilePath}`);

      // 6. Загрузка готового MP4 в S3
      const fileBuffer = fs.readFileSync(outputFilePath);
      const s3Url = await this.storageService.uploadFile(
        fileBuffer,
        'video/mp4',
        'renders',
      );
      this.logger.log(`☁️ Uploaded to S3: ${s3Url}`);

      // 7. Очистка
      fs.unlinkSync(outputFilePath);

      // 8. Финал: Обновляем проект
      project.status = 'COMPLETED' as any;
      project.resultVideoUrl = s3Url;
      await this.projectsService.save(project); // Убедись, что метод save есть в сервисе

      return { result: s3Url };
    } catch (error) {
      this.logger.error(`Pipeline Failed: ${error.message}`, error.stack);
      // TODO: Поставить статус FAILED в БД
      throw error;
    }
  }

  // Вынес логику Kling в отдельный метод для чистоты
  private async generateKlingVideo(
    imageUrl: string,
    prompt: string,
  ): Promise<string> {
    // 1. Запуск задачи
    const taskId = await this.aiVideoService.generateKlingVideo(
      imageUrl,
      prompt,
    );
    this.logger.log(`Kling Task ID: ${taskId}`);

    // 2. Поллинг
    let videoUrl: string | undefined;
    for (let i = 0; i < this.maxPollAttempts; i++) {
      await delay(this.pollDelayMs);
      const result = await this.aiVideoService.checkTaskStatus(taskId);

      if (result.status === 'completed') {
        videoUrl = result.videoUrl;
        break;
      }
      if (result.status === 'failed')
        throw new Error('Kling generation failed');
    }

    if (!videoUrl) throw new Error('Kling Timeout');

    // 3. Скачивание и сохранение "сырого" видео (для истории)
    // Можно пропустить этот шаг для скорости, если нам нужен только финал,
    // но лучше сохранить ассет.
    const videoData = await this.proxyService.get<Buffer>(videoUrl, {
      responseType: 'arraybuffer',
    });
    const s3Url = await this.storageService.uploadFile(
      Buffer.from(videoData),
      'video/mp4',
      'videos',
    );

    return s3Url;
  }
}
