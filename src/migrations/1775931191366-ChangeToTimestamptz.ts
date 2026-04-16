import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775931191366 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775931191366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "status" SET DEFAULT 'draft'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    }

}
