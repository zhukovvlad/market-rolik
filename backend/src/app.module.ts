import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Импорт наших сущностей
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Asset } from './projects/asset.entity';
import { Transaction } from './transactions/transaction.entity';
import { QueuesModule } from './queues/queues.module';
import { CommonModule } from './common/common.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 1. Чтение .env файла
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Подключение к БД
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Project, Asset, Transaction],
        synchronize: true, // ВНИМАНИЕ: Только для разработки! В проде используем миграции.
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    QueuesModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}