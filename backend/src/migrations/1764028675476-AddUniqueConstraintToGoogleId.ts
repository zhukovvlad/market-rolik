/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToGoogleId1764028675476
  implements MigrationInterface
{
  name = 'AddUniqueConstraintToGoogleId1764028675476';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Превращаем пустые строки в NULL, чтобы избежать конфликта уникальности
    await queryRunner.query(
      `UPDATE "users" SET "googleId" = NULL WHERE "googleId" = ''`,
    );

    // 2. Добавляем ограничение уникальности (if not exists)
    const constraintExists = await queryRunner.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'UQ_f382af58ab36057334fb262efd5'
        `);

    if (!constraintExists || constraintExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraintExists = await queryRunner.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'UQ_f382af58ab36057334fb262efd5'
        `);

    if (constraintExists && constraintExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`,
      );
    }
  }
}
