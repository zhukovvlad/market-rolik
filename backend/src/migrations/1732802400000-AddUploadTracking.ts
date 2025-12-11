import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUploadTracking1732802400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL 13+ supports gen_random_uuid() natively without extensions
    await queryRunner.createTable(
      new Table({
        name: 'upload_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'fileUrl',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'claimed',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    // Add indexes for cleanup queries
    await queryRunner.query(
      'CREATE INDEX idx_upload_tracking_claimed_uploaded ON upload_tracking (claimed, "uploadedAt")'
    );
    await queryRunner.query(
      'CREATE INDEX idx_upload_tracking_user_id ON upload_tracking ("userId")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_upload_tracking_claimed_uploaded');
    await queryRunner.query('DROP INDEX IF EXISTS idx_upload_tracking_user_id');
    await queryRunner.dropTable('upload_tracking');
  }
}
