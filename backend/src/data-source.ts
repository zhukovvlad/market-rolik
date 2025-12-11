import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Asset } from './projects/asset.entity';
import { Transaction } from './transactions/transaction.entity';
import { RefreshToken } from './auth/refresh-token.entity';

// Load .env file.
// Note: We use process.cwd() to resolve the .env file path.
// This assumes that the application (or migration command) is always executed
// from the "backend" directory (the project root), which is the standard behavior
// for "npm run" scripts defined in package.json.
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'market_rolik',
  entities: [User, Project, Asset, Transaction, RefreshToken],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
