import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775920675640 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775920675640'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_item" ADD "comment" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "comment"`);
    }

}
