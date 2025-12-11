import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('refresh_tokens')
@Index(['userId', 'expiresAt']) // Index for efficient cleanup and validation queries
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Store hashed token for security (we'll hash using bcrypt)
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Helper method to check if token is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
