import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776535281174 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776535281174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP COLUMN "createdAt"`);
    }

}
