import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776700560729 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776700560729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "courier" ADD CONSTRAINT "UQ_90a53256b36059c19eb42a5d63a" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "courier" ADD CONSTRAINT "FK_90a53256b36059c19eb42a5d63a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" DROP CONSTRAINT "FK_90a53256b36059c19eb42a5d63a"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP CONSTRAINT "UQ_90a53256b36059c19eb42a5d63a"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "userId"`);
    }

}
