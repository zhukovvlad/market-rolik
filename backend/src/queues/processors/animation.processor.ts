/**
 * @fileoverview Animation Processor - Этап 2: Генерация видео и финальный рендер
 * 
 * Этот процессор отвечает за второй этап пайплайна (запускается после одобрения фона пользователем):
 * 1. Генерация видео-анимации (Kling AI Image-to-Video)
 * 2. Композиция финального видео через Remotion (видео + TTS + музыка + УТП)
 * 
 * Запускается только когда пользователь подтвердил, что фон и TTS его устраивают.
 * Это самый дорогой этап (~20-30₽), поэтому важно не запускать его зря.
 * 
 * @module AnimationProcessor
 * @requires @nestjs/bull
 */

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVideoService } from '../../common/ai-video.service';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { ProxyService } from '../../common/proxy.service';
import { RenderService } from '../../common/render.service';
import { ProjectStatus } from '../../projects/project.entity';
import { AssetType } from '../../projects/asset.entity';
import { VideoCompositionInput } from '../../common/interfaces/video-composition.interface';
import { TtsService } from '../../common/tts.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../projects/asset.entity';
import * as fs from 'fs';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getDimensions(ratio: string = '9:16'): { width: number; height: number } {
  switch (ratio) {
    case '16:9': return { width: 1024, height: 576 };
    case '9:16': return { width: 576, height: 1024 };
    case '1:1':  return { width: 1024, height: 1024 };
    case '4:3':  return { width: 1024, height: 768 };
    case '3:4':  return { width: 768, height: 1024 };
    default:     return { width: 576, height: 1024 };
  }
}

/**
 * Процессор для генерации анимации (Этап 2)
 */
@Processor('video-generation')
export class AnimationProcessor {
  private readonly logger = new Logger(AnimationProcessor.name);
  private readonly pollDelayMs: number;
  private readonly maxPollAttempts: number;
  private readonly videoDownloadTimeoutMs: number;

  constructor(
    private readonly aiVideoService: AiVideoService,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly proxyService: ProxyService,
    private readonly renderService: RenderService,
    private readonly ttsService: TtsService,
    private readonly configService: ConfigService,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {
    this.pollDelayMs = parseInt(this.configService.get<string>('VIDEO_POLL_DELAY_MS', '10000'), 10);
    this.maxPollAttempts = parseInt(this.configService.get<string>('VIDEO_MAX_POLL_ATTEMPTS', '30'), 10);
    this.videoDownloadTimeoutMs = parseInt(this.configService.get<string>('VIDEO_DOWNLOAD_TIMEOUT_MS', '120000'), 10);
  }

  /**
   * Этап 2: Анимация видео + Финальный рендер
   * 
   * Джоб: animate-image
   * Вход: { projectId: string }
   * Предусловие: Проект в статусе IMAGE_READY (фон одобрен пользователем)
   * Выход: Статус COMPLETED + финальное видео
   */
  @Process('animate-image')
  async handleAnimateImage(job: Job<{ projectId: string }>) {
    const { projectId } = job.data;
    this.logger.log(`🎬 START Animation for Project ${projectId}`);

    try {
      const project = await this.projectsService.findOne(projectId);
      
      // Проверка статуса
      if (project.status !== ProjectStatus.IMAGE_READY) {
        throw new Error(`Project must be in IMAGE_READY status, current: ${project.status}`);
      }

      project.status = ProjectStatus.GENERATING_VIDEO;
      await this.projectsService.save(project);

      const settings = project.settings || {};
      const { width, height } = getDimensions(settings.aspectRatio);

      // --- 1. ПОЛУЧАЕМ АКТИВНУЮ СЦЕНУ ---
      // Используем activeSceneAssetId если указан, иначе fallback на последнюю сцену
      let sceneAsset: Asset | null = null;
      
      if (settings.activeSceneAssetId) {
        sceneAsset = await this.assetRepository.findOne({
          where: { 
            id: settings.activeSceneAssetId,
            project: { id: projectId },
            type: AssetType.IMAGE_SCENE 
          }
        });
        this.logger.log(`✅ Using selected scene: ${settings.activeSceneAssetId}`);
      }
      
      // Fallback: если активная сцена не найдена, берем последнюю
      if (!sceneAsset) {
        sceneAsset = await this.assetRepository.findOne({
          where: { 
            project: { id: projectId }, 
            type: AssetType.IMAGE_SCENE 
          },
          order: { createdAt: 'DESC' }
        });
        this.logger.warn(`⚠️ Active scene not found, using latest scene`);
      }

      if (!sceneAsset) {
        throw new Error('Scene asset not found. Did you run generate-background first?');
      }

      const highResUrl = sceneAsset.storageUrl;
      this.logger.log(`✅ Using scene from: ${highResUrl}`);

      // TTS (может быть null, если пользователь отключил озвучку)
      const ttsAsset = await this.assetRepository.findOne({
        where: { 
          project: { id: projectId }, 
          type: AssetType.AUDIO_TTS 
        },
        order: { createdAt: 'DESC' }
      });
      const ttsUrl = ttsAsset?.storageUrl || null;

      // --- 2. ГЕНЕРАЦИЯ ВИДЕО (Kling AI) ---
      this.logger.log('🎬 Generating animation with Kling AI...');
      
      const klingPrompt = settings.prompt || "slow cinematic camera zoom in, floating dust particles, high quality, 4k";
      let s3VideoUrl: string | null = null;

      try {
        s3VideoUrl = await this.generateKlingVideoInternal(highResUrl, klingPrompt);
        this.logger.log(`✅ Kling animation ready: ${s3VideoUrl}`);

        // Сохраняем как Asset
        const videoAsset = this.assetRepository.create({
          project: { id: projectId },
          type: AssetType.VIDEO_FRAGMENT,
          provider: 'kling',
          storageUrl: s3VideoUrl,
          meta: { prompt: klingPrompt },
        });
        await this.assetRepository.save(videoAsset);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`❌ Kling failed: ${errMsg}. Will use static image in video.`);
        s3VideoUrl = null; // Remotion будет использовать статическую картинку
      }

      // --- 3. МУЗЫКА (Берем из библиотеки) ---
      const musicUrl = this.ttsService.getBackgroundMusicUrl(settings.musicTheme);

      // --- 4. ФИНАЛЬНЫЙ РЕНДЕР (Remotion) ---
      this.logger.log('🎞️ Rendering final video with Remotion...');

      const inputProps: VideoCompositionInput = {
        title: settings.productName || 'Новинка',
        mainImage: highResUrl, 
        bgVideoUrl: s3VideoUrl,
        usps: settings.usps || [],
        primaryColor: '#4f46e5',
        audioUrl: ttsUrl,
        backgroundMusicUrl: musicUrl,
        width: width * 2, 
        height: height * 2,
      };

      const outputFilePath = await this.renderService.renderVideo(inputProps);
      
      const fileBuffer = fs.readFileSync(outputFilePath);
      const finalS3Url = await this.storageService.uploadFile(fileBuffer, 'video/mp4', 'renders');
      
      try { fs.unlinkSync(outputFilePath); } catch (e) {}

      // --- 5. ЗАВЕРШЕНИЕ ---
      project.status = ProjectStatus.COMPLETED;
      project.resultVideoUrl = finalS3Url;
      await this.projectsService.save(project);

      this.logger.log(`🎉 ANIMATION COMPLETE! Final video: ${finalS3Url}`);
      return { result: finalS3Url };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      
      // attemptsMade начинается с 0, поэтому добавляем +1 для отображения
      const currentAttempt = job.attemptsMade + 1;
      const maxAttempts = job.opts.attempts || 1;
      
      this.logger.error(`❌ Animation FAILED for Project ${projectId} (attempt ${currentAttempt}/${maxAttempts})`, errorMessage);
      
      // Меняем статус на FAILED только если исчерпаны все попытки
      const isLastAttempt = currentAttempt >= maxAttempts;
      
      if (isLastAttempt) {
        this.logger.error(`❌ All retry attempts exhausted. Marking project as FAILED.`);
        try {
          const project = await this.projectsService.findOne(projectId);
          if (project) {
            project.status = ProjectStatus.FAILED;
            const newSettings = {
              ...project.settings,
              lastError: error instanceof Error ? error.message : String(error),
              failedAt: new Date().toISOString(),
            };
            project.settings = newSettings;
            
            this.logger.log(`💾 Saving project with FAILED status. Settings: ${JSON.stringify(newSettings)}`);
            await this.projectsService.save(project);
            this.logger.log(`✅ Project marked as FAILED successfully`);
          } else {
            this.logger.error(`❌ Project ${projectId} not found when trying to mark as FAILED`);
          }
        } catch (dbError) {
          this.logger.error(`❌ Failed to update project status to FAILED`, dbError);
        }
      } else {
        this.logger.warn(`⚠️ Attempt ${currentAttempt} failed. Will retry...`);
      }
      
      throw error;
    }
  }

  /**
   * Генерация видео через Kling AI с polling механизмом
   */
  private async generateKlingVideoInternal(imageUrl: string, prompt: string): Promise<string> {
    const taskId = await this.aiVideoService.generateKlingVideo(imageUrl, prompt);
    this.logger.log(`🎬 Kling Task ID: ${taskId}`);

    for (let i = 0; i < this.maxPollAttempts; i++) {
      await delay(this.pollDelayMs);
      const result = await this.aiVideoService.checkTaskStatus(taskId);

      if (result.status === 'completed') {
        this.logger.log(`✅ Kling Success!`);
        if (!result.videoUrl) throw new Error('Kling completed but no videoUrl provided');
        
        // Скачиваем и пересохраняем в S3
        const videoData = await this.proxyService.get<Buffer>(result.videoUrl, { 
          responseType: 'arraybuffer',
          timeout: this.videoDownloadTimeoutMs,
        });
        return await this.storageService.uploadFile(Buffer.from(videoData), 'video/mp4', 'videos');
      }
      
      if (result.status === 'failed') {
        throw new Error(`Kling generation failed`);
      }

      this.logger.log(`⏳ Kling still processing... (attempt ${i + 1}/${this.maxPollAttempts})`);
    }
    
    throw new Error(`Kling timeout after ${this.maxPollAttempts} attempts`);
  }
}
