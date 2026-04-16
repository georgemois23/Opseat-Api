import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773952857564 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773952857564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" RENAME COLUMN "types" TO "categories"`);
        await queryRunner.query(`ALTER TYPE "public"."restaurant_types_enum" RENAME TO "restaurant_categories_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."restaurant_categories_enum" RENAME TO "restaurant_types_enum"`);
        await queryRunner.query(`ALTER TABLE "restaurant" RENAME COLUMN "categories" TO "types"`);
    }

}
