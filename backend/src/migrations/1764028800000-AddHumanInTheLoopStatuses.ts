import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHumanInTheLoopStatuses1764028800000 implements MigrationInterface {
    name = 'AddHumanInTheLoopStatuses1764028800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Добавляем новые статусы в enum
        await queryRunner.query(`
            ALTER TYPE "public"."projects_status_enum" 
            ADD VALUE IF NOT EXISTS 'GENERATING_IMAGE'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."projects_status_enum" 
            ADD VALUE IF NOT EXISTS 'IMAGE_READY'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."projects_status_enum" 
            ADD VALUE IF NOT EXISTS 'GENERATING_VIDEO'
        `);

        // Добавляем новые типы ассетов
        await queryRunner.query(`
            ALTER TYPE "public"."assets_type_enum" 
            ADD VALUE IF NOT EXISTS 'IMAGE_SCENE'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."assets_type_enum" 
            ADD VALUE IF NOT EXISTS 'IMAGE_UPSCALED'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."assets_type_enum" 
            ADD VALUE IF NOT EXISTS 'AUDIO_TTS'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL не поддерживает удаление значений из enum через ALTER TYPE
        // Нужно пересоздавать enum, что опасно для production
        // Поэтому down миграция оставлена пустой
        // В случае необходимости rollback - делать вручную
    }
}
