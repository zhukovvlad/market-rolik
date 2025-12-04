import { Controller, Get, Post, Body, Logger, UseGuards, Req, ForbiddenException, BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProxyService } from './common/proxy.service';
import { StorageService } from './storage/storage.service';
import { IsOptional, IsUrl, IsString, IsUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects/projects.service';
import { AssetType } from './projects/asset.entity';
import { Request } from 'express';
import { AiTextService } from './common/ai-text.service';
import { AnalyzeImageDto } from './dto/analyze-image.dto';
import { RenderService } from './common/render.service';
import { VideoCompositionInput } from './common/interfaces/video-composition.interface';

interface IpifyResponse {
  ip: string;
}

class TestPhotoroomDto {
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}

class TestVideoDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly projectsService: ProjectsService,
    private readonly aiTextService: AiTextService,
    private readonly renderService: RenderService,
  ) { }

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

  @Post('create-test-user')
  async createTestUser() {
    const email = 'test@example.com';
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      user = this.userRepository.create({
        email,
        passwordHash: 'hashed_password_stub', // В реальном приложении тут должен быть хеш
        creditsBalance: 100,
      });
      await this.userRepository.save(user);
      this.logger.log(`Created test user: ${user.id}`);
    } else {
      this.logger.log(`Test user already exists: ${user.id}`);
    }

    return {
      message: 'Test user ready',
      userId: user.id,
      email: user.email,
    };
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
        projectId: body.projectId,
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

  @Post('ai/analyze-image')
  @UseGuards(AuthGuard('jwt'))
  async analyzeImage(@Body() dto: AnalyzeImageDto) {
    return this.aiTextService.generateProductData(dto.imageUrl);
  }

  // Тест генерации Видео (Kling)
  @Post('test-video')
  @UseGuards(AuthGuard('jwt'))
  async testVideo(@Body() body: TestVideoDto, @Req() req: Request & { user: { id: string } }) {
    // Verify project ownership
    if (body.projectId) {
      await this.projectsService.findOne(body.projectId, req.user.id);
      // Let ProjectsService throw its own HttpException for not-found/forbidden cases.
    }

    // Если картинки нет, берем дефолтную (но лучше передавать реальную из S3)
    const url =
      body.imageUrl ||
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop';

    // Save the uploaded image as an asset (if not already saved)
    if (body.projectId && body.imageUrl) {
      try {
        await this.projectsService.addAsset(
          body.projectId,
          body.imageUrl,
          AssetType.IMAGE_CLEAN,
          's3',
          {
            uploadedAt: new Date().toISOString(),
            source: 'user_upload',
          }
        );
        this.logger.log(`Image saved as asset for project ${body.projectId}`);
      } catch (error) {
        // If asset already exists or other error, log but continue
        this.logger.warn('Could not save image asset:', error instanceof Error ? error.message : String(error));
      }
    }

    const job = await this.videoQueue.add('generate-kling', {
      projectId: body.projectId,
      userId: req.user.id,
      imageUrl: url,
      prompt: 'Cinematic slow motion, floating in the air, 4k advertising shot',
    });

    return {
      status: 'queued',
      jobId: job.id,
      message:
        'Видео генерируется. Это займет время (в Mock-режиме 10 сек). Проверяй консоль.',
    };
  }

  @Post('test-render')
  @UseGuards(AuthGuard('jwt'))
  async testRender() {
    const inputProps: VideoCompositionInput = {
      title: "Тестовый Рендер",
      mainImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000",
      usps: ["Работает на сервере", "Без браузера", "MP4 готов"],
      primaryColor: "#ef4444"
    };
    
    const videoPath = await this.renderService.renderVideo(inputProps);
    
    return { status: 'success', path: videoPath };
  }
}
