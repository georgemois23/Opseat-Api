import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1776532353288 implements MigrationInterface {
    name = 'ChangeToTimestamptz1776532353288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."restaurant_user_applicationstatus_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD "applicationStatus" "public"."restaurant_user_applicationstatus_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP COLUMN "applicationStatus"`);
        await queryRunner.query(`DROP TYPE "public"."restaurant_user_applicationstatus_enum"`);
    }

}
