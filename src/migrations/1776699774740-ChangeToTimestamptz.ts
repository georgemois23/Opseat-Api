import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776699774740 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776699774740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "approved"`);
        await queryRunner.query(`CREATE TYPE "public"."courier_applicationstatus_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "applicationStatus" "public"."courier_applicationstatus_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "vehicleType"`);
        await queryRunner.query(`CREATE TYPE "public"."courier_vehicletype_enum" AS ENUM('bike', 'car', 'scooter', 'other')`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "vehicleType" "public"."courier_vehicletype_enum" NOT NULL DEFAULT 'bike'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "vehicleType"`);
        await queryRunner.query(`DROP TYPE "public"."courier_vehicletype_enum"`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "vehicleType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "courier" DROP COLUMN "applicationStatus"`);
        await queryRunner.query(`DROP TYPE "public"."courier_applicationstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "courier" ADD "approved" boolean NOT NULL DEFAULT false`);
    }

}
