import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1773922031132 implements MigrationInterface {
    name = 'ChangeToTimestamptz1773922031132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."restaurant_types_enum" AS ENUM('souvlaki', 'gyros', 'burgers', 'pizza', 'pasta', 'seafood', 'fish', 'meat', 'kebab', 'salads', 'breakfast', 'cafe', 'coffee', 'desserts', 'ice_cream', 'juices', 'smoothies', 'vegetarian', 'vegan', 'fast_food', 'street_food', 'sandwiches', 'wraps', 'pancakes', 'waffles', 'donuts', 'pies', 'bakery', 'greek_traditional', 'mediterranean', 'asian', 'sushi', 'chinese', 'fast_drinks', 'beer', 'wine', 'cocktails')`);
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "types" "public"."restaurant_types_enum" array DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "types"`);
        await queryRunner.query(`DROP TYPE "public"."restaurant_types_enum"`);
    }

}
