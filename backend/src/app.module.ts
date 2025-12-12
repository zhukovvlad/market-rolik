import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
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
import { RefreshToken } from './auth/refresh-token.entity';
import { QueuesModule } from './queues/queues.module';
import { CommonModule } from './common/common.module';
import { ProjectsModule } from './projects/projects.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { IpThrottlerGuard } from './common/guards/ip-throttler.guard';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    // 1. Чтение .env файла с валидацией
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors at once
        allowUnknown: true, // Allow other env vars not in schema
      },
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
        return [
          {
            ttl: Number.isFinite(ttl) ? ttl : 60000,
            limit: Number.isFinite(limit) ? limit : 10,
          },
        ];
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
        entities: [
          User,
          Project,
          Asset,
          Transaction,
          UploadTracking,
          RefreshToken,
        ],
        // Only enable auto-sync in development. Defaults to false for safety.
        // In production/staging, always use migrations to avoid data loss.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
    {
      provide: APP_GUARD,
      useClass: IpThrottlerGuard,
    },
  ],
})
export class AppModule {}
