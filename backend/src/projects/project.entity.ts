import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Asset } from './asset.entity';

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  RENDERING = 'RENDERING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
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
  settings: Record<string, any>;

  // Сценарий от LLM
  @Column('jsonb', { nullable: true })
  scenario: any;

  // Ссылка на готовое видео (в S3)
  @Column({ nullable: true })
  resultVideoUrl: string;

  // Ассеты (видео-фрагменты, озвучка), привязанные к проекту
  @OneToMany(() => Asset, (asset) => asset.project)
  assets: Asset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}