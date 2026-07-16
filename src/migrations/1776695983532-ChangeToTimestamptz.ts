import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776695983532 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776695983532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "is_guest"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "is_guest" boolean NOT NULL DEFAULT false`);
    }

}
