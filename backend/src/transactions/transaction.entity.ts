import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT', // Покупка пакета
  SPEND = 'SPEND', // Трата на генерацию
  REFUND = 'REFUND', // Возврат при ошибке
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column()
  amount: number; // +300 или -30

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
