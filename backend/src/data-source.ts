import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Asset } from './projects/asset.entity';
import { Transaction } from './transactions/transaction.entity';

dotenv.config({ path: path.join(__dirname, '../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'market_rolik',
  entities: [User, Project, Asset, Transaction],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
