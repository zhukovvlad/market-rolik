import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Asset } from './asset.entity';
import { ProjectSettings } from './interfaces/project-settings.interface';

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  
  // Этап 1: Генерация фона
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  IMAGE_READY = 'IMAGE_READY', // Стоп-фактор: ждем подтверждения пользователя
  
  // Этап 2: Анимация видео
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  
  // Финальные статусы
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  
  // Legacy статусы (можно удалить после миграции)
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  RENDERING = 'RENDERING',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, (user) => user.projects)
  user: User;

  @Column()
  userId: string; // Полезно для быстрого доступа без JOIN

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  // Настройки генерации (Вайб, формат, музыка)
  @Column('jsonb', { default: {} })
  settings: ProjectSettings;

  // Сценарий от LLM
  @Column('jsonb', { nullable: true })
  scenario: any;

  // Ссылка на готовое видео (в S3)
  @Column({ nullable: true })
  resultVideoUrl: string;

  // Ассеты (видео-фрагменты, озвучка), привязанные к проекту
  @OneToMany(() => Asset, (asset) => asset.project, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  assets: Asset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
