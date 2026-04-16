import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773259522489 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773259522489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "deliveryRadius" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "deliveryRadius"`);
    }

}
