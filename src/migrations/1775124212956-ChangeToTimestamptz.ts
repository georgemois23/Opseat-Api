import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775124212956 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775124212956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "publicId" character varying`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD CONSTRAINT "UQ_d533ed36f3dee9667d8553b4c53" UNIQUE ("publicId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP CONSTRAINT "UQ_d533ed36f3dee9667d8553b4c53"`);
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "publicId"`);
    }

}
