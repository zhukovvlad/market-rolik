import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommonModule } from '../common/common.module';
import { StorageModule } from '../storage/storage.module';
import { ProjectsModule } from '../projects/projects.module';
import { ImageProcessor } from './processors/image.processor';
import { VideoProcessor } from './processors/video.processor';

@Module({
  imports: [
    CommonModule,
    StorageModule,
    ProjectsModule,
    
    BullModule.registerQueue({ name: 'image-processing' }),
    BullModule.registerQueue({ name: 'video-generation' }),
  ],
  providers: [
    ImageProcessor,
    VideoProcessor,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
