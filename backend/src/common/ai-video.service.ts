// src/common/ai-video.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';

export interface VideoTaskResponse {
  code: number;
  data: {
    task_id: string;
    status: string; // 'processing', 'completed', 'failed'
    output?: {
      video_url?: string; // Ссылка на готовое видео
    };
  };
  message: string;
}

@Injectable()
export class AiVideoService {
  private readonly logger = new Logger(AiVideoService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService,
  ) {}

  // 1. Запуск генерации (Image to Video)
  async generateKlingVideo(
    imageUrl: string,
    prompt: string,
    options?: { negative_prompt?: string; cfg_scale?: number },
  ): Promise<string> {
    const apiKey = this.configService.get<string>('PIAPI_API_KEY');

    // === MOCK MODE ===
    if (!apiKey || apiKey === 'mock') {
      this.logger.warn('🎬 Mock Mode: Возвращаем фейковый ID задачи');
      return 'mock-task-id-' + Date.now();
    }
    // ================

    const payload = {
      model: 'kling',
      task_type: 'image_to_video',
      input: {
        image_url: imageUrl,
        prompt: prompt || 'Product cinematic shot, high quality, 4k',
        negative_prompt:
          options?.negative_prompt || 'blur, distortion, low quality',
        cfg_scale: options?.cfg_scale ?? 0.5,
      },
      config: {
        service_mode: 'public', // или 'private'
        webhook_config: { endpoint: '' }, // Мы используем поллинг, вебхук пустой
      },
    };

    try {
      this.logger.log('🚀 Отправка задачи в PiAPI (Kling)...');
      const response = await this.proxyService.post<VideoTaskResponse>(
        'https://api.piapi.ai/api/v1/task',
        payload,
        {
          headers: { 'x-api-key': apiKey },
        },
      );

      if (response.code !== 200 || !response.data?.task_id) {
        throw new Error(`PiAPI Error: ${response.message}`);
      }

      return response.data.task_id;
    } catch (error) {
      this.logger.error(`Failed to start video gen: ${error.message}`);
      throw error;
    }
  }

  // 2. Проверка статуса (Polling)
  async checkTaskStatus(
    taskId: string,
  ): Promise<{ status: string; videoUrl?: string }> {
    const apiKey = this.configService.get<string>('PIAPI_API_KEY');

    // === MOCK MODE ===
    if (!apiKey || apiKey === 'mock') {
      // Эмулируем, что видео готово
      return {
        status: 'completed',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Тестовое видео (зайчик)
      };
    }
    // ================

    const response = await this.proxyService.get<VideoTaskResponse>(
      `https://api.piapi.ai/api/v1/task/${taskId}`,
      {
        headers: { 'x-api-key': apiKey },
      },
    );

    const status = response.data.status; // usually 'pending', 'processing', 'completed', 'failed'

    if (status === 'completed') {
      return { status: 'completed', videoUrl: response.data.output?.video_url };
    }

    return { status };
  }
}
