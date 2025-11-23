import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { Asset, AssetType } from './asset.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
  ) {}

  // Создать проект
  async createProject(userId: string, title: string) {
    const project = this.projectsRepository.create({
      title,
      userId, // Твоя колонка для ID
      user: { id: userId } as any, // Привязка связи TypeORM (cast to any to avoid strict type checks on partial relation)
      status: ProjectStatus.DRAFT, // <--- Используем твой Enum
      settings: {},
    });
    return await this.projectsRepository.save(project);
  }

  // Найти проект
  async findOne(id: string) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['assets'], // Грузим сразу с картинками
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  // Добавить ассет (сохранить результат работы AI)
  async addAsset(
    projectId: string,
    storageUrl: string,
    type: AssetType, // <--- Строгая типизация
    provider: string,
    meta: any = {},
  ) {
    // Сначала проверим, существует ли проект
    const project = await this.findOne(projectId);

    const asset = this.assetsRepository.create({
      project: { id: project.id } as any, // Связываем по ID
      storageUrl,
      type,
      provider,
      meta,
    });

    return await this.assetsRepository.save(asset);
  }
}
