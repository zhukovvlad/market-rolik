import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideoProcessor } from './test.processor';

@Module({
  imports: [
    // Регистрируем конкретную очередь
    BullModule.registerQueue({
      name: 'video-generation',
    }),
  ],
  providers: [VideoProcessor],
  exports: [BullModule], // Экспортируем, чтобы другие модули могли кидать сюда задачи
})
export class QueuesModule {}
