// src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { CleanupService } from './cleanup.service';
import { ConfigModule } from '@nestjs/config';
import { Asset } from '../projects/asset.entity';
import { UploadTracking } from './upload-tracking.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Asset, UploadTracking]),
  ],
  providers: [StorageService, CleanupService],
  exports: [StorageService, CleanupService],
})
export class StorageModule {}
