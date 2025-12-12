import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { Asset, AssetType } from './asset.entity';
import { User } from '../users/user.entity';
import { ProjectSettings } from './interfaces/project-settings.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Create a project
  async createProject(
    userId: string,
    title: string,
    settings: ProjectSettings = {},
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const project = this.projectsRepository.create({
      title,
      userId, // User ID column
      user, // Use full user object
      status: ProjectStatus.DRAFT, // <--- Use your Enum
      settings: settings,
    });
    return await this.projectsRepository.save(project);
  }

  // Find a project by ID (optionally check ownership)
  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const project = await this.projectsRepository.findOne({
      where,
      relations: ['assets'], // Eager load with assets
    });

    if (!project) {
      // If userId was provided, it might exist but belong to someone else
      // But for security, we just say "Not Found"
      throw new NotFoundException(`Project not found`);
    }
    return project;
  }

  // Find all projects for a user
  async findAll(userId: string) {
    return await this.projectsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['assets'],
    });
  }

  // Add an asset (save AI processing result)
  async addAsset(
    projectId: string,
    storageUrl: string,
    type: AssetType, // <--- Strict typing
    provider: string,
    meta: any = {},
  ) {
    if (!storageUrl?.trim()) {
      throw new BadRequestException('storageUrl cannot be empty');
    }
    try {
      new URL(storageUrl);
    } catch {
      throw new BadRequestException('storageUrl must be a valid URL');
    }

    // Check if project exists first
    const project = await this.findOne(projectId);

    const asset = this.assetsRepository.create({
      project, // Use full project object
      storageUrl,
      type,
      provider,
      meta,
    });

    return await this.assetsRepository.save(asset);
  }

  // Удаление проекта
  async remove(id: string, userId: string) {
    // Удаляем только если ID совпадает И владелец совпадает
    const result = await this.projectsRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Project ${id} not found or you don't have permission`,
      );
    }
    return { deleted: true };
  }

  async save(project: Project) {
    return this.projectsRepository.save(project);
  }

  /**
   * Обновляет только статус проекта без затирания relations
   */
  async updateStatus(projectId: string, status: ProjectStatus) {
    await this.projectsRepository.update({ id: projectId }, { status });
  }

  /**
   * Обновляет статус и частично обновляет settings (мержит с существующими)
   * Использует атомарное обновление через PostgreSQL JSONB || оператор
   */
  async updateStatusAndSettings(
    projectId: string,
    status: ProjectStatus,
    partialSettings: Partial<ProjectSettings>,
  ) {
    const result = await this.projectsRepository
      .createQueryBuilder()
      .update(Project)
      .set({
        status,
        settings: () => `COALESCE(settings, '{}'::jsonb) || :partial::jsonb`,
      })
      .where('id = :id', { id: projectId })
      .setParameters({ partial: JSON.stringify(partialSettings ?? {}) })
      .returning('*')
      .execute();

    if (!result.affected) throw new NotFoundException('Project not found');
  }

  /**
   * Устанавливает выбранную сцену как активную для анимации
   * Позволяет пользователю переключаться между разными вариантами фона
   */
  async setActiveScene(projectId: string, assetId: string, userId: string) {
    const project = await this.findOne(projectId, userId);

    // Проверяем, что этот ассет реально принадлежит этому проекту
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset) {
      throw new BadRequestException('Asset not found in this project');
    }
    if (asset.type !== AssetType.IMAGE_SCENE) {
      throw new BadRequestException(
        `Asset type must be IMAGE_SCENE, got ${asset.type}`,
      );
    }

    // Обновляем настройки
    project.settings = {
      ...project.settings,
      activeSceneAssetId: asset.id,
    };

    // Если у ассета в метаданных есть промпт, восстанавливаем его в настройки,
    // чтобы пользователь видел тот промпт, который создал эту картинку
    if (asset.meta?.prompt) {
      project.settings.scenePrompt = asset.meta.prompt;
    }

    return await this.projectsRepository.save(project);
  }
}
