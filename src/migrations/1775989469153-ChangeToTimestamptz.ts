import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775989469153 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775989469153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "placedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "order" ADD "estimatedDeliveryTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "estimatedDeliveryTime"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "placedAt"`);
    }

}
