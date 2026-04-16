import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773400570081 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773400570081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "slug" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "slug"`);
    }

}
