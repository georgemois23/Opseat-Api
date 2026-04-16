import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773578368912 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773578368912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" RENAME COLUMN "isOpen" TO "isDelivering"`);
        await queryRunner.query(`CREATE TYPE "public"."restaurant_schedule_dayofweek_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6')`);
        await queryRunner.query(`CREATE TABLE "restaurant_schedule" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" "public"."restaurant_schedule_dayofweek_enum" NOT NULL DEFAULT '1', "openTime" TIME NOT NULL, "closeTime" TIME NOT NULL, "isClosed" boolean NOT NULL DEFAULT true, "restaurantId" uuid, CONSTRAINT "PK_e27c5fda13004877a32734d805f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" ADD CONSTRAINT "FK_b740cfb364ff3b216127f825427" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_schedule" DROP CONSTRAINT "FK_b740cfb364ff3b216127f825427"`);
        await queryRunner.query(`DROP TABLE "restaurant_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."restaurant_schedule_dayofweek_enum"`);
        await queryRunner.query(`ALTER TABLE "restaurant" RENAME COLUMN "isDelivering" TO "isOpen"`);
    }

}
