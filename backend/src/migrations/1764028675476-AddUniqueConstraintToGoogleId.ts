import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToGoogleId1764028675476 implements MigrationInterface {
    name = 'AddUniqueConstraintToGoogleId1764028675476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`);
    }

}
