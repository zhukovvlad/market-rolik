import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum AssetType {
  IMAGE_CLEAN = 'IMAGE_CLEAN', // Фото без фона
  IMAGE_SCENE = 'IMAGE_SCENE', // Фон от Photoroom (этап 1)
  IMAGE_UPSCALED = 'IMAGE_UPSCALED', // Upscale от Stability AI
  VIDEO_FRAGMENT = 'VIDEO_FRAGMENT', // Генерация Kling/SVD
  AUDIO_TTS = 'AUDIO_TTS', // Озвучка от YandexCloud TTS
  AUDIO_VOICEOVER = 'AUDIO_VOICEOVER',
  AUDIO_MUSIC = 'AUDIO_MUSIC',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: AssetType,
  })
  type: AssetType;

  @Column()
  provider: string; // 'kling', 'photoroom', 'yandex'

  @Column()
  storageUrl: string; // Ссылка на файл в S3

  @Column('jsonb', { nullable: true })
  meta: any; // Длительность, промпт, параметры

  @CreateDateColumn()
  createdAt: Date;
}
