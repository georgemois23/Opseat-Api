import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1774690971277 implements MigrationInterface {
    name = 'ChangeToTimestamptz1774690971277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ingredient_category_enum" AS ENUM('sauce', 'meat', 'cheese', 'vegetable', 'bread', 'drink_base', 'coffee', 'spice', 'other')`);
        await queryRunner.query(`CREATE TABLE "ingredient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "category" "public"."ingredient_category_enum" NOT NULL DEFAULT 'other', "available" boolean NOT NULL DEFAULT true, "restaurantId" uuid, CONSTRAINT "PK_6f1e945604a0b59f56a57570e98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_item_ingredient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer, "required" boolean NOT NULL DEFAULT true, "menuItemId" uuid, "ingredientId" uuid, CONSTRAINT "PK_cb8110bf823f554136563a12384" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ingredient" ADD CONSTRAINT "FK_67303879c5cc3143bd3c012ade7" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_item_ingredient" ADD CONSTRAINT "FK_e02f3b0df8f201f1bed16910f51" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_item_ingredient" ADD CONSTRAINT "FK_6af543758e49f0e9f95b13bea14" FOREIGN KEY ("ingredientId") REFERENCES "ingredient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_item_ingredient" DROP CONSTRAINT "FK_6af543758e49f0e9f95b13bea14"`);
        await queryRunner.query(`ALTER TABLE "menu_item_ingredient" DROP CONSTRAINT "FK_e02f3b0df8f201f1bed16910f51"`);
        await queryRunner.query(`ALTER TABLE "ingredient" DROP CONSTRAINT "FK_67303879c5cc3143bd3c012ade7"`);
        await queryRunner.query(`DROP TABLE "menu_item_ingredient"`);
        await queryRunner.query(`DROP TABLE "ingredient"`);
        await queryRunner.query(`DROP TYPE "public"."ingredient_category_enum"`);
    }

}
