// src/queues/processors/image.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from '../../common/proxy.service';
import { StorageService } from '../../storage/storage.service';
import FormData from 'form-data';
import axios from 'axios';

@Processor('image-processing')
export class ImageProcessor {
  private readonly logger = new Logger(ImageProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyService: ProxyService,
    private readonly storageService: StorageService,
  ) {}

  @Process('remove-background')
  async handleRemoveBackground(job: Job<{ imageUrl: string }>) {
    this.logger.log(`🎨 Начало обработки фона для: ${job.data.imageUrl}`);

    const apiKey = this.configService.get<string>('PHOTOROOM_API_KEY');
    
    // 1. Скачиваем исходник
    const imageResponse = await axios.get(job.data.imageUrl, {
      responseType: 'arraybuffer',
    });
    const inputBuffer = Buffer.from(imageResponse.data);
    this.logger.log(`📥 Картинка скачана (${inputBuffer.length} байт).`);

    let resultBuffer: Buffer;

    // === MOCK РЕЖИМ (ЕСЛИ КЛЮЧА НЕТ ИЛИ ОН НЕВЕРНЫЙ) ===
    // Если ключа нет или он "mock", мы просто вернем ту же картинку
    if (!apiKey || apiKey === 'your_photoroom_key_here' || apiKey === 'mock') {
      this.logger.warn('⚠️ Используется MOCK-режим (без реального AI). Возвращаем оригинал.');
      resultBuffer = inputBuffer; // Просто "эхо"
    } 
    // === РЕАЛЬНЫЙ РЕЖИМ ===
    else {
      try {
        const formData = new FormData();
        formData.append('image_file', inputBuffer, {
          filename: 'input.jpg',
          contentType: 'image/jpeg',
        });
        
        const imageBuffer = await this.proxyService.post<Buffer>(
          'https://sdk.photoroom.com/v1/segment',
          formData,
          {
            headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
            responseType: 'arraybuffer',
          },
        );
        resultBuffer = Buffer.from(imageBuffer);
        this.logger.log('✅ AI успешно удалил фон!');
      } catch (e) {
        this.logger.error(`❌ Ошибка AI: ${e.message}. Переключаюсь на возврат оригинала.`);
        // Fallback: чтобы не валить процесс, вернем оригинал при ошибке
        resultBuffer = inputBuffer;
      }
    }

    // 3. Загружаем результат в S3 (Timeweb)
    const s3Url = await this.storageService.uploadFile(resultBuffer, 'image/png', 'processed');
    this.logger.log(`🚀 Готово! Результат в облаке: ${s3Url}`);

    return {
      original: job.data.imageUrl,
      processed: s3Url,
    };
  }
}