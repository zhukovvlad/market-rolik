import { Controller, Post, Body, Get, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards, Req, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Throttle } from '@nestjs/throttler';
import { StorageService } from '../storage/storage.service';
import { CleanupService } from '../storage/cleanup.service';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssetType } from './asset.entity';
import { UserRole } from '../users/user.entity';

import { ProjectSettings } from './interfaces/project-settings.interface';

type AuthenticatedRequest = Request & { user: { id: string; role: UserRole } };

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly storageService: StorageService,
    private readonly cleanupService: CleanupService,
    @InjectQueue('video-generation') private readonly videoQueue: Queue,
  ) { }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.projectsService.findAll(req.user.id);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
    @Body('projectId') projectId?: string,
  ) {
    const url = await this.storageService.uploadFile(file.buffer, file.mimetype);
    
    // Track this upload for cleanup
    await this.cleanupService.trackUploadedFile(url, req.user.id);
    
    // If projectId is provided, save the image as an asset
    if (projectId && req.user.id) {
      await this.projectsService.addAsset(
        projectId,
        url,
        AssetType.IMAGE_CLEAN,
        's3',
        {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        }
      );
      
      // File is now saved, stop tracking for cleanup
      await this.cleanupService.untrackFile(url);
    }
    
    return { url };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 projects per minute
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req: AuthenticatedRequest) {
    const project = await this.projectsService.createProject(
      req.user.id,
      createProjectDto.title,
      createProjectDto.settings as ProjectSettings
    );

    // Save mainImage as asset if provided
    if (createProjectDto.settings?.mainImage) {
      try {
        await this.projectsService.addAsset(
          project.id,
          createProjectDto.settings.mainImage,
          AssetType.IMAGE_CLEAN,
          's3',
          {
            uploadedAt: new Date().toISOString(),
            source: 'user_upload',
          }
        );
      } catch (error) {
        // If asset already exists or other error, log but continue
        this.logger.warn('Could not save mainImage as asset', {
          projectId: project.id,
          mainImage: createProjectDto.settings.mainImage,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Security: Pass userId to queue for ownership verification
    // Запускаем Этап 1: Генерация фона + TTS
    await this.videoQueue.add('generate-background', {
      projectId: project.id,
    }, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true, 
      removeOnFail: false,
    });

    return project;
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.findOne(id, req.user.id);
  }

  /**
   * Регенерация фона с новым промптом (Этап 1 повторно)
   * Пользователь может вызывать этот эндпоинт несколько раз, пока не получит нужный результат
   */
  @Post(':id/regenerate-bg')
  @UseGuards(AuthGuard('jwt'))
  async regenerateBackground(
    @Param('id') id: string,
    @Body('scenePrompt') scenePrompt: string,
    @Req() req: AuthenticatedRequest
  ) {
    const project = await this.projectsService.findOne(id, req.user.id);
    
    // Обновляем промпт в настройках
    project.settings = {
      ...project.settings,
      scenePrompt: scenePrompt || project.settings.scenePrompt,
    };
    await this.projectsService.save(project);

    // Запускаем генерацию фона заново
    await this.videoQueue.add('generate-background', {
      projectId: project.id,
    }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return { message: 'Background regeneration started', projectId: project.id };
  }

  /**
   * Запуск анимации видео (Этап 2)
   * Вызывается только когда пользователь одобрил фон и TTS
   */
  @Post(':id/animate')
  @UseGuards(AuthGuard('jwt'))
  async animateVideo(
    @Param('id') id: string,
    @Body('prompt') animationPrompt: string,
    @Req() req: AuthenticatedRequest
  ) {
    const project = await this.projectsService.findOne(id, req.user.id);
    
    // Обновляем animation промпт если предоставлен
    if (animationPrompt) {
      project.settings = {
        ...project.settings,
        prompt: animationPrompt,
      };
      await this.projectsService.save(project);
    }

    // Запускаем Этап 2: Анимация
    await this.videoQueue.add('animate-image', {
      projectId: project.id,
    }, {
      attempts: 1, // Анимация дорогая, не ретраим автоматически
      removeOnComplete: true,
      removeOnFail: false,
    });

    return { message: 'Animation started', projectId: project.id };
  }

  /**
   * Выбор одного из ранее сгенерированных фонов
   * Позволяет пользователю вернуться к предыдущей генерации
   */
  @Post(':id/select-scene')
  @UseGuards(AuthGuard('jwt'))
  async selectScene(
    @Param('id') id: string,
    @Body('assetId') assetId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.projectsService.setActiveScene(id, assetId, req.user.id);
  }
  
  @Get('cleanup/run-now')
  @UseGuards(AuthGuard('jwt'))
  async runCleanup(@Req() req: AuthenticatedRequest) {
    // NOTE: This endpoint is primarily for operational/testing use.
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can run cleanup manually');
    }
    
    const result = await this.cleanupService.runCleanupNow();
    return {
      message: 'Cleanup completed',
      ...result,
    };
  }
  
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.remove(id, req.user.id);
  }
}
