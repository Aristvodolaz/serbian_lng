import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds SM-2 scheduling state to user_word_progress:
//   easeFactor  real NOT NULL DEFAULT 2.5 — ease factor for interval growth
//   intervalMs  bigint NULLABLE — previous interval the next GOOD/EASY scales
//
// Statements are guarded (IF NOT EXISTS) so the migration also runs cleanly
// against a schema already reconciled by TYPEORM_SYNCHRONIZE.
export class WordProgressSrs1796000000000 implements MigrationInterface {
  name = 'WordProgressSrs1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_word_progress" ADD COLUMN IF NOT EXISTS "easeFactor" real NOT NULL DEFAULT 2.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_word_progress" ADD COLUMN IF NOT EXISTS "intervalMs" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_word_progress" DROP COLUMN IF EXISTS "intervalMs"`);
    await queryRunner.query(`ALTER TABLE "user_word_progress" DROP COLUMN IF EXISTS "easeFactor"`);
  }
}
