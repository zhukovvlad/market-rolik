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
import { VideoCompositionInput } from '../../common/interfaces/video-composition.interface';
import { TtsService } from '../../common/tts.service';
// import { AiTextService } from '../../common/ai-text.service'; // Раскомментируй, когда будет готов сервис текстов
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

// Хелпер для пауз
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Хелпер для размеров (Photoroom требует явных пикселей)
function getDimensions(ratio: string = '9:16'): { width: number; height: number } {
  // Базовые размеры для генерации (не 4K, чтобы не перегружать вход Stability)
  // Stability потом увеличит это в x2 или x4
  switch (ratio) {
    case '16:9': return { width: 1024, height: 576 };
    case '9:16': return { width: 576, height: 1024 };
    case '1:1':  return { width: 1024, height: 1024 };
    case '4:3':  return { width: 1024, height: 768 };
    case '3:4':  return { width: 768, height: 1024 };
    default:     return { width: 576, height: 1024 };
  }
}

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
    private readonly renderService: RenderService,
    private readonly ttsService: TtsService,
    // private readonly aiTextService: AiTextService, // Внедрить, когда будет готово
  ) {
    this.pollDelayMs = this.configService.get<number>('VIDEO_POLL_DELAY_MS') || 10000;
    this.maxPollAttempts = this.configService.get<number>('VIDEO_MAX_POLL_ATTEMPTS') || 30;
  }

  // ========================================================================
  // 🎨 ШАГ 1: ГЕНЕРАЦИЯ СЦЕНЫ (Photoroom v2/edit)
  // ========================================================================
  private async generateAiScene(
    imageUrl: string, 
    prompt: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    this.logger.log(`🎨 Step 1: Generating Scene via Photoroom ("${prompt}") at ${width}x${height}...`);
    const apiKey = this.configService.get<string>('PHOTOROOM_API_KEY');
    
    // Скачиваем оригинал
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const inputBuffer = Buffer.from(imageResponse.data);

    if (!apiKey || apiKey === 'mock') {
        this.logger.warn('⚠️ Photoroom Mock: Skipping scene generation');
        return inputBuffer;
    }

    const formData = new FormData();
    formData.append('image_file', inputBuffer, { filename: 'original.jpg' });
    formData.append('prompt', prompt); 
    // Задаем размер выходной картинки (важно для 16:9 и прочих форматов)
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    try {
      const response = await this.proxyService.post<Buffer>(
        'https://image-api.photoroom.com/v2/edit',
        formData,
        {
          headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
          responseType: 'arraybuffer',
        },
      );
      return Buffer.from(response);
    } catch (error) {
      this.logger.error(`❌ Photoroom Scene Gen failed: ${error}. Using original.`);
      return inputBuffer; 
    }
  }

  // ========================================================================
  // 🚀 ШАГ 2: UPSCALE (Stability AI Fast - исправленный)
  // ========================================================================
  private async upscaleImageFast(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log('🚀 Step 2: Upscaling Image (Stability Fast)...');
    const apiKey = this.configService.get<string>('STABILITY_API_KEY');

    if (!apiKey || apiKey === 'mock') {
        this.logger.warn('⚠️ Stability Mock: Skipping upscale');
        return imageBuffer;
    }

    // 1. Умный ресайз перед отправкой (чтобы не словить 400 Bad Request из-за лимита пикселей)
    // Лимит Stability ~4.19Mpx на выходе. Вход должен быть не больше ~1024px по длинной стороне.
    const resizedBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside' }) 
        .toFormat('png')
        .toBuffer();

    const formData = new FormData();
    formData.append('image', resizedBuffer, { filename: 'scene.png' });
    formData.append('output_format', 'png'); 
    // ВАЖНО: Убираем 'prompt', так как /fast endpoint его не поддерживает!

    try {
      const response = await this.proxyService.post<Buffer>(
        'https://api.stability.ai/v2beta/stable-image/upscale/fast',
        formData,
        {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/*', // ВАЖНО: Исправленный заголовок (был image/png)
            ...formData.getHeaders() 
          },
          responseType: 'arraybuffer',
        },
      );
      this.logger.log(`✅ Upscale success!`);
      return Buffer.from(response);
    } catch (error) {
      let errMsg = String(error);
      if (axios.isAxiosError(error) && error.response?.data) {
          // Пытаемся прочитать текст ошибки из буфера
          errMsg = error.response.data.toString();
      }
      this.logger.error(`❌ Stability Upscale failed: ${errMsg}. Continuing with normal resolution.`);
      return imageBuffer; // Fallback: возвращаем обычную картинку
    }
  }

  // ========================================================================
  // 🎬 ГЛАВНЫЙ ПАЙПЛАЙН
  // ========================================================================
  @Process('generate-kling')
  async handleGenerateKling(job: Job<{ projectId: string; userId?: string }>) {
    const { projectId, userId } = job.data;
    const pipelineStartTime = Date.now();
    this.logger.log(`🎬 START Pipeline for Project ${projectId}`);

    try {
      const project = await this.projectsService.findOne(projectId);
      if (userId && project.userId !== userId) throw new Error('Unauthorized');
      
      const settings = project.settings || {};
      const originalImageUrl = settings.mainImage;
      if (!originalImageUrl) throw new Error('No main image found');

      // 0. Определяем размеры
      const { width, height } = getDimensions(settings.aspectRatio);

      // --- ЭТАП 1: ВИЗУАЛ (Последовательно) ---
      
      // 1.1 Генерируем сцену (Photoroom)
      const bgPrompt = "professional product photography, on a wooden podium, cinematic lighting, high quality, 4k";
      let visualBuffer = await this.generateAiScene(originalImageUrl, bgPrompt, width, height);

      // 1.2 Апскейл (Stability Fast) - 2 кредита
      visualBuffer = await this.upscaleImageFast(visualBuffer);

      // 1.3 Сохраняем готовую сцену (High Res)
      const highResUrl = await this.storageService.uploadFile(visualBuffer, 'image/png', 'processed');
      this.logger.log(`✅ High-Res Scene saved: ${highResUrl}`);


      // --- ЭТАП 2: КОНТЕНТ (Параллельно: Видео + Звук) ---
      this.logger.log('⚡ Starting Parallel Generation: Kling + TTS...');
      
      const textToSay = settings.ttsText || `${settings.productName || ''}. ${settings.usps?.join('. ') || ''}`;
      const shouldGenerateAudio = (settings.ttsEnabled !== false);

      // Динамический промпт (пока хардкод, позже подключим Gemini)
      let klingPrompt = settings.prompt || "slow cinematic camera zoom in, floating dust particles, high quality, 4k";

      const [s3VideoUrl, ttsResult] = await Promise.all([
        // KLING
        this.generateKlingVideoInternal(highResUrl, klingPrompt).catch(err => {
            this.logger.error(`❌ Kling failed: ${err}. Using static image.`);
            return null;
        }),

        // TTS
        shouldGenerateAudio
          ? this.ttsService.generateSpeech(textToSay, settings.ttsVoice).catch(() => null)
          : Promise.resolve(null),
      ]);


      // --- ЭТАП 3: СБОРКА (Remotion) ---
      let ttsUrl: string | null = null;
      if (ttsResult) {
         ttsUrl = await this.storageService.uploadFile(ttsResult.buffer, ttsResult.mimeType, 'audio');
      }
      const musicUrl = this.ttsService.getBackgroundMusicUrl(settings.musicTheme);

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

      project.status = ProjectStatus.COMPLETED;
      project.resultVideoUrl = finalS3Url;
      await this.projectsService.save(project);

      this.logger.log(`🎉 PROJECT COMPLETE! URL: ${finalS3Url}`);
      return { result: finalS3Url };

    } catch (error) {
      this.logger.error(`Pipeline Failed: ${error}`);
      const project = await this.projectsService.findOne(projectId);
      if (project) {
          project.status = ProjectStatus.FAILED;
          await this.projectsService.save(project);
      }
      throw error;
    }
  }

  // Внутренний метод для Kling (с поллингом)
  private async generateKlingVideoInternal(imageUrl: string, prompt: string): Promise<string> {
    const startTime = Date.now();
    const taskId = await this.aiVideoService.generateKlingVideo(imageUrl, prompt);
    this.logger.log(`🎬 Kling Task ID: ${taskId}`);

    for (let i = 0; i < this.maxPollAttempts; i++) {
      await delay(this.pollDelayMs);
      const result = await this.aiVideoService.checkTaskStatus(taskId);

      if (result.status === 'completed') {
        this.logger.log(`✅ Kling Success!`);
        if (!result.videoUrl) throw new Error('Kling completed but no videoUrl provided');
        // Скачиваем и пересохраняем в S3
        const videoData = await this.proxyService.get<Buffer>(result.videoUrl, { responseType: 'arraybuffer' });
        return await this.storageService.uploadFile(Buffer.from(videoData), 'video/mp4', 'videos');
      }
      if (result.status === 'failed') throw new Error(`Kling status: failed`);
    }
    throw new Error('Kling Timeout');
  }
}