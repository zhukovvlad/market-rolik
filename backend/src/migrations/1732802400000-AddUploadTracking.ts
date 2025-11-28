import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUploadTracking1732802400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'upload_tracking',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('upload_tracking');
  }
}
