import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEmailIndex1765466016525 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
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
