// src/queues/processors/video.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { AiVideoService } from '../../common/ai-video.service';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { AssetType } from '../../projects/asset.entity';
import axios from 'axios';

// Функция паузы (sleep)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Processor('video-generation')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly aiVideoService: AiVideoService,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Process('generate-kling')
  async handleGenerateKling(
    job: Job<{ projectId: string; imageUrl: string; prompt: string }>,
  ) {
    const { projectId, imageUrl, prompt } = job.data;
    this.logger.log(`🎬 Start Video Gen for Project ${projectId}`);

    try {
      // 1. Запуск задачи
      const taskId = await this.aiVideoService.generateKlingVideo(
        imageUrl,
        prompt,
      );
      this.logger.log(`Task ID received: ${taskId}. Waiting for completion...`);

      // 2. Цикл ожидания (Polling)
      // Максимум 30 проверок по 10 секунд = 5 минут ожидания
      let videoUrl: string | undefined;

      for (let i = 0; i < 30; i++) {
        await delay(10000); // Ждем 10 секунд перед проверкой

        const result = await this.aiVideoService.checkTaskStatus(taskId);
        this.logger.log(
          `Task ${taskId} status: ${result.status} (attempt ${i + 1})`,
        );

        if (result.status === 'completed') {
          videoUrl = result.videoUrl;
          break;
        }
        if (result.status === 'failed') {
          throw new Error('Video generation failed on provider side');
        }
      }

      if (!videoUrl) {
        throw new Error('Timeout: Video generation took too long');
      }

      // 3. Скачиваем видео к себе (чтобы не зависеть от ссылок API)
      this.logger.log('📥 Downloading video result...');
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });
      const videoBuffer = Buffer.from(videoResponse.data);

      // 4. Загружаем в наш S3
      const s3Url = await this.storageService.uploadFile(
        videoBuffer,
        'video/mp4',
        'videos',
      );
      this.logger.log(`🚀 Video uploaded to S3: ${s3Url}`);

      // 5. Сохраняем в БД
      await this.projectsService.addAsset(
        projectId,
        s3Url,
        AssetType.VIDEO_FRAGMENT,
        'kling',
        { prompt, originalTask: taskId },
      );

      return { videoUrl: s3Url };
    } catch (error) {
      this.logger.error(`Video Gen Error: ${error.message}`);
      throw error;
    }
  }
}
