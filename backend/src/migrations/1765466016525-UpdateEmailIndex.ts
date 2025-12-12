/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmailIndex1765466016525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check for case-insensitive email duplicates before creating index
    const duplicates = await queryRunner.query(`
            SELECT LOWER(email) as email_lower, COUNT(*) as count
            FROM "users"
            GROUP BY LOWER(email)
            HAVING COUNT(*) > 1
        `);

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot create unique index on email: found ${duplicates.length} case-insensitive duplicate group(s). ` +
          `Please resolve duplicates before running this migration. ` +
          `Hint: run "SELECT LOWER(email) AS email_lower, COUNT(*) FROM \\"users\\" GROUP BY LOWER(email) HAVING COUNT(*) > 1;" to inspect them.`,
      );
    }

    // Ensure email is case-insensitive and unique
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USER_EMAIL_LOWER" 
            ON "users" (LOWER("email"))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_EMAIL_LOWER"`);
  }
}
