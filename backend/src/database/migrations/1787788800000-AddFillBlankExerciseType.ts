import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFillBlankExerciseType1787788800000 implements MigrationInterface {
  name = 'AddFillBlankExerciseType1787788800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "exercises_type_enum" ADD VALUE IF NOT EXISTS 'fill_blank'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support DROP VALUE from enum.
    // This migration is irreversible — future migration would need
    // to recreate the enum type from scratch if removal is required.
  }
}