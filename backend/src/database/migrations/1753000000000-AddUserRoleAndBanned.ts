import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndBanned1753000000000 implements MigrationInterface {
  name = 'AddUserRoleAndBanned1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "user_role_enum" NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "banned" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banned"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
