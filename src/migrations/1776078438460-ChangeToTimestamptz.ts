import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776078438460 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776078438460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."order_deliverytype_enum" AS ENUM('delivery', 'pickup')`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryType" "public"."order_deliverytype_enum" NOT NULL DEFAULT 'delivery'`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryAddress" text`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryLat" double precision`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryLng" double precision`);
        await queryRunner.query(`ALTER TABLE "order" ADD "deliveryNotes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryNotes"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryLng"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryLat"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryAddress"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "deliveryType"`);
        await queryRunner.query(`DROP TYPE "public"."order_deliverytype_enum"`);
    }

}
