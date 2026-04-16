import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1772625448270 implements MigrationInterface {
    name = 'ChangeToTimestamptz1772625448270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('customer', 'restaurant_owner', 'restaurant_staff', 'courier', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer', "first_name" character varying, "last_name" character varying, "disabled" boolean NOT NULL DEFAULT false, "temporarily_disabled" TIMESTAMP WITH TIME ZONE, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "is_guest" boolean NOT NULL DEFAULT 'false', "resetToken" character varying, "resetTokenExpiry" TIMESTAMP, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
