import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProxyService } from './common/proxy.service';
import { StorageService } from './storage/storage.service';
import { IsOptional, IsUrl } from 'class-validator';

interface IpifyResponse {
  ip: string;
}

class TestPhotoroomDto {
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    // 👇 Старая очередь (видео)
    @InjectQueue('video-generation') private readonly videoQueue: Queue,
    // 👇 НОВАЯ ОЧЕРЕДЬ (добавь эту строку!)
    @InjectQueue('image-processing') private readonly imageQueue: Queue,
    private readonly proxyService: ProxyService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-queue')
  async testQueue() {
    await this.videoQueue.add('test-job', {
      foo: 'bar',
      date: new Date(),
    });
    return { status: 'Job added to queue' };
  }

  @Get('check-ip')
  async checkIp() {
    const data = await this.proxyService.get<IpifyResponse>(
      'https://api.ipify.org?format=json',
    );
    return {
      message: 'Запрос выполнен успешно',
      my_ip: data,
    };
  }

  @Get('test-upload')
  async testUpload() {
    this.logger.log('🚀 Начинаю тест загрузки в S3 (Timeweb)...');

    const fakeFile = Buffer.from(
      'Привет! Это проверка связи с Timeweb S3 для Market-Rolik.',
    );

    const url = await this.storageService.uploadFile(fakeFile, 'text/plain');

    this.logger.log(`✅ Файл загружен: ${url}`);

    return {
      status: 'success',
      message: 'Файл успешно улетел в облако!',
      url: url,
    };
  }

  // Теперь ошибок не будет, так как imageQueue объявлен в конструкторе
  @Post('test-photoroom')
  async testPhotoroom(@Body() body: TestPhotoroomDto) {
    // Если URL не передали, берем тестовый (кроссовки Nike)
    const url =
      body.imageUrl ||
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';

    try {
      const job = await this.imageQueue.add('remove-background', {
        imageUrl: url,
      });

      return {
        status: 'started',
        jobId: job.id,
        message: 'Задача отправлена воркеру. Смотри логи терминала!',
        input_image: url,
      };
    } catch (error) {
      this.logger.error('Failed to enqueue image processing job', error);
      throw error;
    }
  }
}
