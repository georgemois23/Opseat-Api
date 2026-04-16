import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeToTimestamptz1775403367980 implements MigrationInterface {
    name = 'ChangeToTimestamptz1775403367980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" ADD "imageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant" DROP COLUMN "imageUrl"`);
    }

}
