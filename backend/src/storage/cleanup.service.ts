import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Asset } from '../projects/asset.entity';
import { UploadTracking } from './upload-tracking.entity';
import { StorageService } from './storage.service';

@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(UploadTracking)
    private uploadTrackingRepository: Repository<UploadTracking>,
    private storageService: StorageService,
  ) {
    this.logger.log('CleanupService initialized. Cron job will run every minute.');
  }

  async onModuleInit() {
    this.logger.log('CleanupService module initialized - running initial cleanup check...');
    await this.cleanupOrphanedFiles();
  }

  /**
   * Track uploaded file (called from upload endpoint)
   */
  async trackUploadedFile(url: string, userId?: string): Promise<void> {
    const tracking = this.uploadTrackingRepository.create({
      fileUrl: url,
      userId,
      claimed: false,
    });
    await this.uploadTrackingRepository.save(tracking);
    this.logger.debug(`Tracked uploaded file in DB: ${url}`);
  }

  /**
   * Remove file from tracking (called when asset is saved)
   */
  async untrackFile(url: string): Promise<void> {
    await this.uploadTrackingRepository.update(
      { fileUrl: url },
      { claimed: true }
    );
    this.logger.debug(`Marked file as claimed: ${url}`);
  }

  /**
   * Run cleanup every 20 minutes
   * Clean up files uploaded more than 20 minutes ago that are not in assets table
   */
  @Cron('0 */20 * * * *') // Every 20 minutes
  async cleanupOrphanedFiles(): Promise<void> {
    this.logger.log('Starting cleanup of orphaned files...');

    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes

    // Find unclaimed uploads older than threshold
    const orphanedUploads = await this.uploadTrackingRepository.find({
      where: {
        claimed: false,
        uploadedAt: LessThan(twentyMinutesAgo),
      },
    });

    this.logger.log(`Found ${orphanedUploads.length} unclaimed uploads older than 20 minutes`);

    // Delete orphaned files from S3 and tracking table
    for (const upload of orphanedUploads) {
      try {
        // Double-check: is this file really not in assets?
        const asset = await this.assetsRepository.findOne({
          where: { storageUrl: upload.fileUrl },
        });

        if (!asset) {
          // Delete from S3
          await this.storageService.deleteFile(upload.fileUrl);
          // Delete tracking record
          await this.uploadTrackingRepository.remove(upload);
          this.logger.log(`Deleted orphaned file: ${upload.fileUrl} (uploaded at ${upload.uploadedAt})`);
        } else {
          // File exists in assets but wasn't marked as claimed - fix it
          upload.claimed = true;
          await this.uploadTrackingRepository.save(upload);
          this.logger.log(`File found in assets, marked as claimed: ${upload.fileUrl}`);
        }
      } catch (error) {
        this.logger.error(`Failed to process orphaned file ${upload.fileUrl}:`, error);
      }
    }

    if (orphanedUploads.length === 0) {
      this.logger.log('No orphaned files found');
    } else {
      this.logger.log(`Cleanup completed`);
    }
  }

  /**
   * Manual cleanup trigger (for testing)
   */
  async runCleanupNow(): Promise<{ deleted: number; tracked: number }> {
    await this.cleanupOrphanedFiles();
    const trackedCount = await this.uploadTrackingRepository.count({
      where: { claimed: false },
    });
    return {
      deleted: 0, // Would need to track this separately
      tracked: trackedCount,
    };
  }
}
