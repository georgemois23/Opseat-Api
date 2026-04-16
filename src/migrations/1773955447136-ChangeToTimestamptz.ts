import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773955447136 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773955447136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" ALTER COLUMN "dayOfWeek" SET DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" ALTER COLUMN "dayOfWeek" SET DEFAULT '0'`);
    }

}
