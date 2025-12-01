import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVideoService } from '../../common/ai-video.service';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { AssetType } from '../../projects/asset.entity';
import { ProxyService } from '../../common/proxy.service';
import { RenderService } from '../../common/render.service';
import { ProjectStatus } from '../../projects/project.entity';
import { VideoCompositionInput } from '../../common/interfaces/video-composition.interface';
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

    try {
      const response = await this.proxyService.post<Buffer>(
        'https://sdk.photoroom.com/v1/segment',
        formData,
        {
          headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
          responseType: 'arraybuffer',
        },
      );
      return Buffer.from(response);
    } catch (error) {
      this.logger.warn(`⚠️ Photoroom API failed: ${error instanceof Error ? error.message : String(error)}. Using original image.`);
      return inputBuffer;
    }
  }

  // --- ГЛАВНЫЙ ПРОЦЕСС ---
  @Process('generate-kling')
  async handleGenerateKling(job: Job<{ projectId: string }>) {
    const { projectId } = job.data;
    const pipelineStartTime = Date.now();
    
    if (!projectId) {
      throw new Error('projectId is required for video generation pipeline');
    }
    
    this.logger.log(`🎬 Start Pipeline for Project ${projectId} (Job ID: ${job.id})`);

    try {
      // 1. Получаем данные проекта из БД
      const project = await this.projectsService.findOne(projectId);
      const settings = project.settings || {};
      const imageUrl = settings.mainImage;

      if (!imageUrl) throw new Error('No main image found in project');

      // 2. Параллельный запуск: Генерация видео + Удаление фона
      this.logger.log('⚡ Starting parallel tasks: Kling AI + Photoroom');
      const parallelStartTime = Date.now();

      const [klingVideoUrl, cutoutBuffer] = await Promise.all([
        this.generateKlingVideo(
          imageUrl,
          settings.prompt ||
            'Cinematic product shot, high quality, 4k, slow motion',
        ),
        this.removeBackground(imageUrl),
      ]);
      
      const parallelDuration = ((Date.now() - parallelStartTime) / 1000).toFixed(1);
      this.logger.log(`⚡ Parallel tasks completed in ${parallelDuration}s`);

      // 3. Сохраняем вырезанное фото в S3 (для рендера)
      const cutoutUrl = await this.storageService.uploadFile(
        cutoutBuffer,
        'image/png',
        'processed',
      );
      this.logger.log(`✅ Cutout saved: ${cutoutUrl}`);

      // 4. Подготовка данных для Рендера
      const inputProps: VideoCompositionInput = {
        title: settings.productName || project.title || 'Новинка',
        mainImage: cutoutUrl,
        usps:
          settings.usps && settings.usps.length > 0
            ? settings.usps
            : ['Быстрая доставка', 'Отличное качество', 'Хит продаж'],
        primaryColor: '#4f46e5',
      };

      // 5. ЗАПУСК РЕНДЕРА
      this.logger.log('🔥 Rendering final video with Remotion...');
      const renderStartTime = Date.now();
      const outputFilePath = await this.renderService.renderVideo(inputProps);
      const renderDuration = ((Date.now() - renderStartTime) / 1000).toFixed(1);

      this.logger.log(`✅ Render finished in ${renderDuration}s: ${outputFilePath}`);

      // 6. Загрузка готового MP4 в S3
      const fileBuffer = fs.readFileSync(outputFilePath);
      const s3Url = await this.storageService.uploadFile(
        fileBuffer,
        'video/mp4',
        'renders',
      );
      this.logger.log(`☁️ Uploaded to S3: ${s3Url}`);

      // 7. Очистка
      try {
        fs.unlinkSync(outputFilePath);
        this.logger.debug(`🗑️ Cleaned up local file: ${outputFilePath}`);
      } catch (err) {
        this.logger.warn(`Failed to delete local render ${outputFilePath}: ${err instanceof Error ? err.message : String(err)}`);
      }

      // 8. Финал: Обновляем проект
      project.status = ProjectStatus.COMPLETED;
      project.resultVideoUrl = s3Url;
      await this.projectsService.save(project);
      
      const totalDuration = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      this.logger.log(
        `🎉 Pipeline COMPLETED for Project ${projectId} in ${totalDuration}s (Parallel: ${parallelDuration}s, Render: ${renderDuration}s)`,
      );

      return { result: s3Url };
    } catch (error) {
      const failedDuration = ((Date.now() - pipelineStartTime) / 1000).toFixed(1);
      this.logger.error(
        `❌ Pipeline FAILED for Project ${projectId} after ${failedDuration}s: ${error.message}`,
        error.stack,
      );
      
      // Update project status to FAILED
      try {
        const project = await this.projectsService.findOne(projectId);
        project.status = ProjectStatus.FAILED;
        await this.projectsService.save(project);
      } catch (updateError) {
        this.logger.error(
          `Failed to update project status to FAILED: ${updateError.message}`,
        );
      }
      
      throw error;
    }
  }

  // Вынес логику Kling в отдельный метод для чистоты
  private async generateKlingVideo(
    imageUrl: string,
    prompt: string,
  ): Promise<string> {
    const startTime = Date.now();
    
    // 1. Запуск задачи
    const taskId = await this.aiVideoService.generateKlingVideo(
      imageUrl,
      prompt,
    );
    this.logger.log(`🎬 Kling Task ID: ${taskId} - Starting polling...`);

    // 2. Поллинг с улучшенным логированием
    let videoUrl: string | undefined;
    let lastStatus = 'pending';
    
    for (let i = 0; i < this.maxPollAttempts; i++) {
      await delay(this.pollDelayMs);
      const result = await this.aiVideoService.checkTaskStatus(taskId);
      
      // Логируем изменение статуса
      if (result.status !== lastStatus) {
        this.logger.log(
          `📊 Kling Task ${taskId}: ${lastStatus} → ${result.status} (attempt ${i + 1}/${this.maxPollAttempts})`,
        );
        lastStatus = result.status;
      }

      if (result.status === 'completed') {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        this.logger.log(
          `✅ Kling Task ${taskId} completed in ${duration}s after ${i + 1} attempts`,
        );
        videoUrl = result.videoUrl;
        break;
      }
      
      if (result.status === 'failed') {
        this.logger.error(
          `❌ Kling Task ${taskId} failed after ${i + 1} attempts`,
        );
        throw new Error(`Kling generation failed: ${result.status}`);
      }
      
      // Периодическое логирование для длительных задач
      if ((i + 1) % 5 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        this.logger.debug(
          `⏳ Kling Task ${taskId} still ${lastStatus} - ${elapsed}s elapsed (${i + 1}/${this.maxPollAttempts} attempts)`,
        );
      }
    }

    if (!videoUrl) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.error(
        `⏱️ Kling Task ${taskId} TIMEOUT after ${this.maxPollAttempts} attempts (${totalTime}s). Last status: ${lastStatus}`,
      );
      throw new Error(
        `Kling Timeout: Task ${taskId} did not complete after ${this.maxPollAttempts} attempts (${totalTime}s)`,
      );
    }

    // 3. Скачивание и сохранение "сырого" видео (для истории)
    this.logger.log(`📥 Downloading Kling video from: ${videoUrl}`);
    const videoData = await this.proxyService.get<Buffer>(videoUrl, {
      responseType: 'arraybuffer',
    });
    
    const s3Url = await this.storageService.uploadFile(
      Buffer.from(videoData),
      'video/mp4',
      'videos',
    );
    
    this.logger.log(`☁️ Kling raw video archived to S3: ${s3Url}`);

    return s3Url;
  }
}
