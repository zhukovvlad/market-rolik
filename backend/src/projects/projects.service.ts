import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { Asset, AssetType } from './asset.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  // Create a project
  async createProject(userId: string, title: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const project = this.projectsRepository.create({
      title,
      userId, // User ID column
      user, // Use full user object
      status: ProjectStatus.DRAFT, // <--- Use your Enum
      settings: {},
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
      throw new NotFoundException(`Project ${id} not found or you don't have permission`);
    }
    return { deleted: true };
  }
}
