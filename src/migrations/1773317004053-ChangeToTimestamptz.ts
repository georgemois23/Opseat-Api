import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773317004053 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773317004053'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "isOpen" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "isOpen"`);
    }

}
