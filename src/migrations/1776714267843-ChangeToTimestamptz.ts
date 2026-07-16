import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776714267843 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776714267843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "courierId" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_09a8dc00d5ffead302306720bc1" FOREIGN KEY ("courierId") REFERENCES "courier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_09a8dc00d5ffead302306720bc1"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "courierId"`);
    }

}
