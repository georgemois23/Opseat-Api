import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776087850600 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776087850600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "minimumOrderAmount" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "minimumOrderAmount"`);
    }

}
