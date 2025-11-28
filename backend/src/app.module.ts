import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Импорт наших сущностей
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Asset } from './projects/asset.entity';
import { Transaction } from './transactions/transaction.entity';
import { UploadTracking } from './storage/upload-tracking.entity';
import { QueuesModule } from './queues/queues.module';
import { CommonModule } from './common/common.module';
import { ProjectsModule } from './projects/projects.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

@Module({
  imports: [
    // 1. Чтение .env файла
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Schedule Module for cron jobs
    ScheduleModule.forRoot(),

    // Throttler (Rate Limiting)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const ttl = parseInt(config.get('THROTTLE_TTL') ?? '60000', 10);
        const limit = parseInt(config.get('THROTTLE_LIMIT') ?? '10', 10);
        return [{
          ttl: Number.isFinite(ttl) ? ttl : 60000,
          limit: Number.isFinite(limit) ? limit : 10,
        }];
      },
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
        entities: [User, Project, Asset, Transaction, UploadTracking],
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
    StorageModule,
    ProjectsModule,
    AuthModule,
    LoggerModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule { }
