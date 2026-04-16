import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773688893787 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773688893787'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" ALTER COLUMN "dayOfWeek" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" ALTER COLUMN "dayOfWeek" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    }

}
