// src/queues/processors/image.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../../common/proxy.service';
import { StorageService } from '../../storage/storage.service';
import FormData from 'form-data';
import axios from 'axios';
import { Readable } from 'stream';

@Processor('image-processing')
export class ImageProcessor {
  private readonly logger = new Logger(ImageProcessor.name);
  private readonly MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService,
    private readonly storageService: StorageService,
  ) {}

  @Process('remove-background')
  async handleRemoveBackground(job: Job<{ imageUrl: string }>) {
    this.logger.log(`🎨 Начало обработки фона для: ${job.data.imageUrl}`);

    const apiKey = this.configService.get<string>('PHOTOROOM_API_KEY');

    // 1. Скачиваем исходник (безопасно)
    let inputBuffer: Buffer;
    let detectedContentType = 'image/jpeg';

    try {
      const url = new URL(job.data.imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Недопустимый протокол URL (только http/https)');
      }

      const response = await axios.get(job.data.imageUrl, {
        responseType: 'stream',
        timeout: 15000, // 15 секунд таймаут на подключение
      });

      if (response.status !== 200) {
        throw new Error(`Ошибка загрузки: HTTP ${response.status}`);
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Неверный тип контента: ${contentType}`);
      }
      detectedContentType = contentType;

      const chunks: Buffer[] = [];
      let size = 0;

      await new Promise<void>((resolve, reject) => {
        const stream = response.data as Readable;

        stream.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > this.MAX_SIZE) {
            stream.destroy();
            reject(
              new Error(`Превышен лимит размера файла (${this.MAX_SIZE} байт)`),
            );
            return;
          }
          chunks.push(chunk);
        });

        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      inputBuffer = Buffer.concat(chunks);
      this.logger.log(`📥 Картинка скачана (${inputBuffer.length} байт).`);
    } catch (error) {
      this.logger.error(
        `❌ Ошибка при скачивании изображения: ${error.message}`,
      );
      throw error; // Прерываем выполнение, если исходник не получен
    }

    let resultBuffer: Buffer;
    let processingStatus = 'success';
    let processingError: string | null = null;

    // === MOCK РЕЖИМ (ЕСЛИ КЛЮЧА НЕТ ИЛИ ОН НЕВЕРНЫЙ) ===
    // Если ключа нет или он "mock", мы просто вернем ту же картинку
    if (!apiKey || apiKey === 'your_photoroom_key_here' || apiKey === 'mock') {
      this.logger.warn(
        '⚠️ Используется MOCK-режим (без реального AI). Возвращаем оригинал.',
      );
      resultBuffer = inputBuffer; // Просто "эхо"
      processingStatus = 'mock';
    }
    // === РЕАЛЬНЫЙ РЕЖИМ ===
    else {
      try {
        const extension = detectedContentType.split('/')[1] || 'jpg';
        const formData = new FormData();
        formData.append('image_file', inputBuffer, {
          filename: `input.${extension}`,
          contentType: detectedContentType,
        });

        const imageBuffer = await this.proxyService.post<Buffer>(
          'https://sdk.photoroom.com/v1/segment',
          formData,
          {
            headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
            responseType: 'arraybuffer',
            timeout: 60000, // 60 seconds for AI processing
          },
        );
        resultBuffer = Buffer.from(imageBuffer);
        this.logger.log('✅ AI успешно удалил фон!');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.logger.error(
          `❌ Ошибка AI: ${errorMessage}. Переключаюсь на возврат оригинала.`,
        );
        // Fallback: чтобы не валить процесс, вернем оригинал при ошибке
        resultBuffer = inputBuffer;
        processingStatus = 'fallback';
        processingError = errorMessage;
      }
    }

    // 3. Загружаем результат в S3 (Timeweb)
    // Если обработка прошла успешно (Photoroom), то формат PNG.
    // Если был fallback или mock, то формат оригинальный.
    const outputContentType =
      processingStatus === 'success' ? 'image/png' : detectedContentType;

    const s3Url = await this.storageService.uploadFile(
      resultBuffer,
      outputContentType,
      'processed',
    );
    this.logger.log(`🚀 Готово! Результат в облаке: ${s3Url}`);

    return {
      original: job.data.imageUrl,
      processed: s3Url,
      status: processingStatus,
      error: processingError,
      usedFallback: processingStatus === 'fallback',
    };
  }
}
