import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776355652556 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776355652556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_address" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_address" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_address" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "user_address" DROP COLUMN "createdAt"`);
    }

}
