import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773070291507 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773070291507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_address" ADD "streetNumber" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_address" DROP COLUMN "streetNumber"`);
    }

}
