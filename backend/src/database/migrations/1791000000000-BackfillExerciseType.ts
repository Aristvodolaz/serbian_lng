import { MigrationInterface, QueryRunner } from 'typeorm';

// Legacy pre-payload rows can carry a NULL `type` (the old schema had the
// column nullable). The payload-era entity requires NOT NULL, which makes
// TYPEORM_SYNCHRONIZE fail its boot-time schema reconcile with
// "column type of relation exercises contains null values". Backfill the
// husks to a valid type and tighten the column so the entity contract holds.
export class BackfillExerciseType1791000000000 implements MigrationInterface {
  name = 'BackfillExerciseType1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "exercises" SET "type" = 'translation_choice' WHERE "type" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "type" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Content fix, not a schema rollback: legacy NULLs were invalid under the
    // payload-era entity, so there is nothing meaningful to restore.
  }
}
