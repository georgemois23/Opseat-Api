import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776715077282 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776715077282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" ADD "currentLat" double precision`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "currentLng" double precision`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "isAvailable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "isOnline" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "isOnline"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "isAvailable"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "currentLng"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "currentLat"`);
    }

}
