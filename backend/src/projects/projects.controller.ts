import { Controller, Post, Body, Get, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from '../storage/storage.service';
import { CleanupService } from '../storage/cleanup.service';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssetType } from './asset.entity';
import { UserRole } from '../users/user.entity';

type AuthenticatedRequest = Request & { user: { id: string; role: UserRole } };

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly storageService: StorageService,
    private readonly cleanupService: CleanupService,
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
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req: AuthenticatedRequest) {
    return this.projectsService.createProject(
      req.user.id,
      createProjectDto.title,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.findOne(id, req.user.id);
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
