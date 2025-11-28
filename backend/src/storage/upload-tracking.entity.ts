import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('upload_tracking')
export class UploadTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ default: false })
  claimed: boolean; // true when file is saved as asset
}
