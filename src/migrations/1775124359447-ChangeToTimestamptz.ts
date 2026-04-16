import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775124359447 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775124359447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ALTER COLUMN "publicId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ALTER COLUMN "publicId" DROP NOT NULL`);
    }

}
