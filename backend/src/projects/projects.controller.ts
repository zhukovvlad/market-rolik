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
import { RegenerateBackgroundDto } from './dto/regenerate-background.dto';
import { AnimateVideoDto } from './dto/animate-video.dto';
import { AssetType } from './asset.entity';
import { UserRole } from '../users/user.entity';
import { ProjectStatus } from './project.entity';

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

  /**
   * Upload endpoint with strict IP-based rate limiting.
   * Allows 5 uploads per minute per IP to prevent abuse.
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 uploads per minute per IP
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
    // Логируем что пришло от фронтенда
    this.logger.log(`📦 Creating project with settings: ${JSON.stringify(createProjectDto.settings)}`);
    
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
    const project = await this.projectsService.findOne(id, req.user.id);
    this.logger.log(`📤 Returning project ${id}: status=${project.status}, assetsCount=${project.assets?.length || 0}`);
    return project;
  }

  /**
   * Регенерация фона с новым промптом (Этап 1 повторно)
   * Пользователь может вызывать этот эндпоинт несколько раз, пока не получит нужный результат
   */
  @Post(':id/regenerate-bg')
  @UseGuards(AuthGuard('jwt'))
  async regenerateBackground(
    @Param('id') id: string,
    @Body() dto: RegenerateBackgroundDto,
    @Req() req: AuthenticatedRequest
  ) {
    const project = await this.projectsService.findOne(id, req.user.id);
    
    // Обновляем промпт в настройках
    project.settings = {
      ...project.settings,
      scenePrompt: dto.scenePrompt || project.settings.scenePrompt,
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
    @Body() dto: AnimateVideoDto,
    @Req() req: AuthenticatedRequest
  ) {
    const project = await this.projectsService.findOne(id, req.user.id);
    
    // Проверяем статус проекта
    // Important: we allow re-entry if status is already GENERATING_VIDEO (e.g. duplicate clicks)
    if (project.status !== ProjectStatus.IMAGE_READY && project.status !== ProjectStatus.GENERATING_VIDEO) {
      throw new ForbiddenException(
        `Project must be in IMAGE_READY or GENERATING_VIDEO status to animate, current: ${project.status}`,
      );
    }
    
    const jobId = `animate-${project.id}`;
    const existingJob = await this.videoQueue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();
      const inFlightStates = new Set<string>(['active', 'waiting', 'delayed', 'paused', 'stuck']);

      // If there's already an in-flight job, don't enqueue another one.
      if (inFlightStates.has(state)) {
        // Do not mutate prompt/settings for in-flight job.
        // But if the status lagged behind (still IMAGE_READY), bump it so UI polling can continue.
        if (project.status === ProjectStatus.IMAGE_READY) {
          project.status = ProjectStatus.GENERATING_VIDEO;
          await this.projectsService.save(project);
        }
        return { message: 'Animation already in progress', projectId: project.id };
      }

      // Allow re-run after completion/failure by removing the old job with the same id.
      if (['completed', 'failed'].includes(state)) {
        await existingJob.remove();
      }
    }

    // Apply prompt update only when we're actually going to (re)enqueue.
    let didChangeProject = false;

    if (dto.prompt) {
      project.settings = {
        ...project.settings,
        prompt: dto.prompt,
      };
      didChangeProject = true;
    }

    const didMoveToGeneratingVideo = project.status === ProjectStatus.IMAGE_READY;
    if (didMoveToGeneratingVideo) {
      project.status = ProjectStatus.GENERATING_VIDEO;
      didChangeProject = true;
    }

    if (didChangeProject) {
      await this.projectsService.save(project);
    }

    try {
      await this.videoQueue.add(
        'animate-image',
        {
          projectId: project.id,
        },
        {
          jobId,
          attempts: 1, // Анимация дорогая, не ретраим автоматически
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    } catch (error) {
      // If enqueue failed due to a race/duplicate, Bull may still have the job recorded.
      // Avoid relying on error-message patterns.
      try {
        const maybeJob = await this.videoQueue.getJob(jobId);
        if (maybeJob) {
          return { message: 'Animation already in progress', projectId: project.id };
        }
      } catch {
        // ignore, will rollback status below if needed and rethrow
      }

      // If enqueue failed for real (e.g. Redis down), don't leave project stuck in GENERATING_VIDEO.
      if (didMoveToGeneratingVideo) {
        project.status = ProjectStatus.IMAGE_READY;
        await this.projectsService.save(project);
      }

      throw error;
    }

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
