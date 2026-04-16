import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775145036197 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775145036197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('draft', 'pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."order_status_enum" NOT NULL DEFAULT 'pending', "totalPrice" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" uuid, "restaurantId" uuid, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "priceAtOrder" numeric NOT NULL, "orderId" uuid, "menuItemId" uuid, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_item_ingredient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "removed" boolean NOT NULL DEFAULT false, "extra" boolean NOT NULL DEFAULT false, "extraPrice" numeric NOT NULL DEFAULT '0', "orderItemId" uuid, "ingredientId" uuid, CONSTRAINT "PK_ccc5584e6bc1a20b9f3bbbffdb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_124456e637cca7a415897dce659" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_c93f22720c77241d2476c07cabf" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_caa901372ba1b5aa30d1950b458" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item_ingredient" ADD CONSTRAINT "FK_1669e2824807ac5df2726e7a32e" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item_ingredient" ADD CONSTRAINT "FK_dbe9c58c795240d3c01237b6847" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_item_ingredient" DROP CONSTRAINT "FK_dbe9c58c795240d3c01237b6847"`);
        await queryRunner.query(`ALTER TABLE "order_item_ingredient" DROP CONSTRAINT "FK_1669e2824807ac5df2726e7a32e"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_caa901372ba1b5aa30d1950b458"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_c93f22720c77241d2476c07cabf"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_124456e637cca7a415897dce659"`);
        await queryRunner.query(`DROP TABLE "order_item_ingredient"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
    }

}
