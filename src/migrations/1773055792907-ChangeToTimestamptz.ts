import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773055792907 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773055792907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "restaurant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "street" character varying NOT NULL, "city" character varying NOT NULL, "postalCode" character varying NOT NULL, "country" character varying, "latitude" numeric(10,7), "longitude" numeric(10,7), CONSTRAINT "PK_649e250d8b8165cb406d99aa30f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."restaurant_user_role_enum" AS ENUM('owner', 'manager', 'staff')`);
        await queryRunner.query(`CREATE TABLE "restaurant_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."restaurant_user_role_enum" NOT NULL, "userId" uuid, "restaurantId" uuid, CONSTRAINT "PK_aefad5ba2f054d4bbc415b3ef2a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "courier" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicleType" character varying NOT NULL, "street" character varying, "city" character varying, "postalCode" character varying, "country" character varying, "approved" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_94613ec7dc72f7dfa2d072a31cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_address" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying NOT NULL DEFAULT 'Home', "street" character varying NOT NULL, "city" character varying NOT NULL, "postalCode" character varying NOT NULL, "country" character varying, "latitude" numeric(10,7), "longitude" numeric(10,7), "phone" character varying, "isDefault" boolean NOT NULL DEFAULT true, "userId" uuid, CONSTRAINT "PK_302d96673413455481d5ff4022a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD CONSTRAINT "FK_0a1909a19a4769b5591cb1ea34f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" ADD CONSTRAINT "FK_b41fc17d9e794091faf5a939dee" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_address" ADD CONSTRAINT "FK_1abd8badc4a127b0f357d9ecbc2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_address" DROP CONSTRAINT "FK_1abd8badc4a127b0f357d9ecbc2"`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP CONSTRAINT "FK_b41fc17d9e794091faf5a939dee"`);
        await queryRunner.query(`ALTER TABLE "restaurant_user" DROP CONSTRAINT "FK_0a1909a19a4769b5591cb1ea34f"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('customer', 'restaurant_owner', 'restaurant_staff', 'courier', 'admin')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`DROP TABLE "user_address"`);
        await queryRunner.query(`DROP TABLE "courier"`);
        await queryRunner.query(`DROP TABLE "restaurant_user"`);
        await queryRunner.query(`DROP TYPE "public"."restaurant_user_role_enum"`);
        await queryRunner.query(`DROP TABLE "restaurant"`);
    }

}
