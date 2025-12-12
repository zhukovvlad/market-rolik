/**
 * @fileoverview Background Generation Processor - Этап 1: Генерация фона и TTS
 *
 * Этот процессор отвечает за первый этап "human-in-the-loop" пайплайна:
 * 1. Генерация AI-сцены (Photoroom API)
 * 2. Upscaling изображения (Stability AI)
 * 3. Генерация TTS превью (Yandex Cloud)
 *
 * После завершения проект переходит в статус IMAGE_READY и ждет подтверждения пользователя.
 * Это позволяет:
 * - Редактировать промпт без затрат на дорогую генерацию видео
 * - Прослушать озвучку и исправить текст/ударения
 * - Выбрать музыкальную тему
 *
 * @module BackgroundProcessor
 * @requires @nestjs/bull
 */

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { ProjectStatus, Project } from '../../projects/project.entity';
import { AssetType } from '../../projects/asset.entity';
import { TtsService } from '../../common/tts.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../../projects/asset.entity';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getDimensions(ratio: string = '9:16'): {
  width: number;
  height: number;
} {
  switch (ratio) {
    case '16:9':
      return { width: 1024, height: 576 };
    case '9:16':
      return { width: 576, height: 1024 };
    case '1:1':
      return { width: 1024, height: 1024 };
    case '4:3':
      return { width: 1024, height: 768 };
    case '3:4':
      return { width: 768, height: 1024 };
    default:
      return { width: 576, height: 1024 };
  }
}

/**
 * Процессор для генерации фона (Этап 1)
 */
@Processor('video-generation')
export class BackgroundProcessor {
  private readonly logger = new Logger(BackgroundProcessor.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly ttsService: TtsService,
    private readonly configService: ConfigService,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  /**
   * Этап 1: Генерация фона + TTS превью
   *
   * Джоб: generate-background
   * Вход: { projectId: string }
   * Выход: Статус IMAGE_READY + сохраненные ассеты
   */
  @Process('generate-background')
  async handleGenerateBackground(job: Job<{ projectId: string }>) {
    const { projectId } = job.data;
    this.logger.log(`🎨 START Background Generation for Project ${projectId}`);

    try {
      const project = await this.projectsService.findOne(projectId);
      await this.projectsService.updateStatus(
        projectId,
        ProjectStatus.GENERATING_IMAGE,
      );

      const settings = project.settings || {};
      const originalImageUrl = settings.mainImage;
      if (!originalImageUrl) throw new Error('No main image found');

      const { width, height } = getDimensions(settings.aspectRatio);

      // --- 1. ГЕНЕРАЦИЯ СЦЕНЫ (Photoroom) ---
      const scenePromptValue = (settings.scenePrompt as string) ?? '';
      const scenePromptTrimmed = scenePromptValue.trim();

      this.logger.log(
        `🔍 scenePrompt from settings: "${scenePromptValue}" (length: ${scenePromptValue.length})`,
      );

      const bgPrompt = scenePromptTrimmed
        ? scenePromptTrimmed
        : this.configService.get<string>(
            'DEFAULT_SCENE_PROMPT',
            'professional product photography, on a wooden podium, cinematic lighting, high quality, 4k',
          );

      this.logger.log(
        `📸 Generating scene with Photoroom: "${bgPrompt.substring(0, 50)}..."`,
      );
      let visualBuffer = await this.generateAiScene(
        originalImageUrl,
        bgPrompt,
        width,
        height,
      );

      // --- 2. UPSCALE (опционально) ---
      const stabilityKey = this.configService.get<string>(
        'STABILITY_AI_API_KEY',
      );
      if (stabilityKey && stabilityKey !== 'mock') {
        this.logger.log('🔍 Upscaling with Stability AI...');
        visualBuffer = await this.upscaleImageFast(visualBuffer);
      } else {
        this.logger.warn(
          '⚠️ Stability AI disabled (mock or missing key), skipping upscale',
        );
      }

      // --- 3. СОХРАНЕНИЕ В S3 ---
      const highResUrl = await this.storageService.uploadFile(
        visualBuffer,
        'image/png',
        'processed',
      );
      this.logger.log(`✅ High-Res Scene saved: ${highResUrl}`);

      // Сохраняем как Asset (используем projectId для relation)
      const sceneAsset = this.assetRepository.create({
        project: { id: projectId } as Project,
        type: AssetType.IMAGE_SCENE,
        provider: 'photoroom+stability',
        storageUrl: highResUrl,
        meta: {
          prompt: bgPrompt,
          width: width * 2,
          height: height * 2,
          createdAt: new Date().toISOString(),
        },
      });

      const savedSceneAsset = await this.assetRepository.save(sceneAsset);
      this.logger.log(
        `✅ IMAGE_SCENE asset saved with ID: ${savedSceneAsset.id}`,
      );

      // --- 4. ГЕНЕРАЦИЯ TTS (Параллельно, но быстро) ---
      let ttsUrl: string | null = null;
      const textToSay =
        settings.ttsText ||
        `${settings.productName || ''}. ${settings.usps?.join('. ') || ''}`;
      const shouldGenerateAudio =
        settings.ttsEnabled !== false && textToSay.trim().length > 0;

      if (shouldGenerateAudio) {
        this.logger.log('🎙️ Generating TTS preview...');
        try {
          const ttsResult = await this.ttsService.generateSpeech(
            textToSay,
            settings.ttsVoice,
          );
          if (ttsResult) {
            ttsUrl = await this.storageService.uploadFile(
              ttsResult.buffer,
              ttsResult.mimeType,
              'audio',
            );

            const ttsAsset = this.assetRepository.create({
              project: { id: projectId } as Project,
              type: AssetType.AUDIO_TTS,
              provider: 'yandex-cloud',
              storageUrl: ttsUrl,
              meta: { text: textToSay, voice: settings.ttsVoice || 'alena' },
            });
            const savedTtsAsset = await this.assetRepository.save(ttsAsset);
            this.logger.log(
              `✅ TTS saved: ${ttsUrl} (Asset ID: ${savedTtsAsset.id})`,
            );
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `⚠️ TTS generation failed, continuing without audio: ${errMsg}`,
          );
        }
      }

      // --- ФИНАЛ: Переводим в IMAGE_READY и сохраняем настройки ---
      // Атомарно обновляем статус и settings (activeSceneAssetId, scenePrompt)
      await this.projectsService.updateStatusAndSettings(
        projectId,
        ProjectStatus.IMAGE_READY,
        {
          activeSceneAssetId: savedSceneAsset.id,
          scenePrompt: bgPrompt,
        },
      );

      this.logger.log(
        `🎉 Background Generation COMPLETE for Project ${projectId}`,
      );
      return {
        highResUrl,
        ttsUrl,
        status: ProjectStatus.IMAGE_READY,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // attemptsMade начинается с 0, поэтому добавляем +1 для отображения
      const currentAttempt = job.attemptsMade + 1;
      const maxAttempts = job.opts.attempts || 1;

      this.logger.error(
        `❌ Background Generation FAILED for Project ${projectId} (attempt ${currentAttempt}/${maxAttempts})`,
        {
          error: errorMessage,
          stack: errorStack,
        },
      );

      // Меняем статус на FAILED только если исчерпаны все попытки
      const isLastAttempt = currentAttempt >= maxAttempts;

      if (isLastAttempt) {
        this.logger.error(
          `❌ All retry attempts exhausted. Marking project as FAILED.`,
        );
        try {
          const newSettings = {
            lastError: errorMessage,
            failedAt: new Date().toISOString(),
          };

          this.logger.log(
            `💾 Updating project to FAILED status. Error: ${errorMessage}`,
          );
          await this.projectsService.updateStatusAndSettings(
            projectId,
            ProjectStatus.FAILED,
            newSettings,
          );
          this.logger.log(`✅ Project marked as FAILED successfully`);
        } catch (dbError) {
          const dbErrorMessage =
            dbError instanceof Error ? dbError.message : String(dbError);
          this.logger.error(
            `❌ Failed to update project status to FAILED: ${dbErrorMessage}`,
          );
        }
      } else {
        this.logger.warn(`⚠️ Attempt ${currentAttempt} failed. Will retry...`);
      }

      throw error;
    }
  }

  /**
   * Генерация AI-сцены через Photoroom API (v2/edit)
   */
  private async generateAiScene(
    productImageUrl: string,
    prompt: string,
    targetWidth: number,
    targetHeight: number,
  ): Promise<Buffer> {
    const apiKey = this.configService.get<string>('PHOTOROOM_SANDBOX_API_KEY');
    if (!apiKey) throw new Error('PHOTOROOM_SANDBOX_API_KEY not configured');

    const form = new FormData();
    form.append('imageUrl', productImageUrl);
    form.append('background.prompt', prompt);
    form.append('outputSize', `${targetWidth}x${targetHeight}`);

    this.logger.log(
      `📸 Photoroom request: ${productImageUrl.substring(0, 50)}... | ${targetWidth}x${targetHeight}`,
    );

    try {
      const response = await axios.post(
        'https://image-api.photoroom.com/v2/edit',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-api-key': apiKey,
          },
          responseType: 'arraybuffer',
          timeout: 60000,
        },
      );

      if (response.status !== 200) {
        throw new Error(`Photoroom API error: HTTP ${response.status}`);
      }

      this.logger.log(`✅ Photoroom returned ${response.data.length} bytes`);
      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data
          ? Buffer.from(error.response.data).toString()
          : 'No response data';
        this.logger.error(`❌ Photoroom API failed: ${error.message}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: errorData,
          requestUrl: 'https://image-api.photoroom.com/v2/edit',
          requestParams: {
            imageUrl: productImageUrl,
            'background.prompt': prompt,
            outputSize: `${targetWidth}x${targetHeight}`,
          },
        });
      }
      throw error;
    }
  }

  /**
   * Upscale через Stability AI (Fast Upscaler, консервативный 2x)
   */
  private async upscaleImageFast(inputBuffer: Buffer): Promise<Buffer> {
    const apiKey = this.configService.get<string>('STABILITY_AI_API_KEY');
    if (!apiKey) throw new Error('STABILITY_AI_API_KEY not configured');

    const form = new FormData();
    form.append('image', inputBuffer, {
      filename: 'image.png',
      contentType: 'image/png',
    });
    form.append('output_format', 'png');

    this.logger.log('🔍 Stability AI Fast Upscaler...');

    try {
      const response = await axios.post(
        'https://api.stability.ai/v2beta/stable-image/upscale/fast',
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
            Accept: 'image/*',
          },
          responseType: 'arraybuffer',
          timeout: 60000,
        },
      );

      if (response.status !== 200) {
        throw new Error(`Stability API error: HTTP ${response.status}`);
      }

      const upscaledBuffer = Buffer.from(response.data);
      this.logger.log(`✅ Stability returned ${upscaledBuffer.length} bytes`);

      // Конвертируем в PNG через sharp (на случай если вернулся webp)
      return await sharp(upscaledBuffer).png().toBuffer();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data
          ? Buffer.from(error.response.data).toString()
          : 'No response data';
        this.logger.error(`❌ Stability AI failed: ${error.message}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: errorData,
        });
      }
      throw error;
    }
  }
}
