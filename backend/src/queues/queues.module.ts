import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideoProcessor } from './test.processor'; // Твой старый тест
import { ImageProcessor } from './processors/image.processor'; // <--- Наш новый воркер
import { CommonModule } from '../common/common.module'; // <--- Нужно для ProxyService
import { StorageModule } from '../storage/storage.module'; // <--- Нужно для StorageService

@Module({
  imports: [
    CommonModule, // Импортируем, чтобы ImageProcessor видел ProxyService
    StorageModule, // Импортируем, чтобы ImageProcessor видел StorageService

    // Очередь для генерации видео (старая)
    BullModule.registerQueue({
      name: 'video-generation',
    }),

    // 👇 НОВАЯ ОЧЕРЕДЬ для обработки картинок
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  providers: [
    VideoProcessor, // Оставляем старый, чтобы не ломать тесты
    ImageProcessor, // 👇 Регистрируем новый
  ],
  exports: [BullModule],
})
export class QueuesModule {}
