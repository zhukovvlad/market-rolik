import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

// Этот класс будет "слушать" очередь с именем 'video-generation'
@Processor('video-generation')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  @Process('test-job')
  async handleTest(job: Job) {
    this.logger.debug('Start processing...');
    this.logger.debug(`Data: ${JSON.stringify(job.data)}`);
    
    // Имитация бурной деятельности (5 секунд)
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    this.logger.debug('Processing complete!');
    return { result: 'Video Created!' };
  }
}