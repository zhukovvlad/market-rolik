import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommonModule } from '../common/common.module';
import { StorageModule } from '../storage/storage.module';
import { ProjectsModule } from '../projects/projects.module';
import { ImageProcessor } from './processors/image.processor';
import { VideoProcessor } from './processors/video.processor';
import { BackgroundProcessor } from './processors/background.processor';
import { AnimationProcessor } from './processors/animation.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../projects/asset.entity';

@Module({
  imports: [
    CommonModule,
    StorageModule,
    ProjectsModule,
    TypeOrmModule.forFeature([Asset]), // Для доступа к Asset в процессорах

    BullModule.registerQueue({ name: 'image-processing' }),
    BullModule.registerQueue({ name: 'video-generation' }),
  ],
  providers: [
    ImageProcessor,
    VideoProcessor,
    BackgroundProcessor, // Этап 1: Генерация фона
    AnimationProcessor, // Этап 2: Анимация видео
  ],
  exports: [BullModule],
})
export class QueuesModule {}
