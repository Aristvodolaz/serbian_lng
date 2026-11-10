import { MigrationInterface, QueryRunner } from 'typeorm';

// Legacy ladder rows got "intervalMs" only at their first SM-2 review, which
// would reset their schedule to the 1-day base. Backfill it once from the
// review→due spacing the ladder actually used. Rows without both timestamps
// carry no recoverable interval and are left NULL (they schedule as new words).
// Idempotent: the WHERE clause re-matches nothing on a re-run.
export class BackfillWordProgressIntervals1797000000000 implements MigrationInterface {
  name = 'BackfillWordProgressIntervals1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "user_word_progress"
       SET "intervalMs" = extract(epoch from ("nextReviewAt" - "lastReviewedAt")) * 1000
       WHERE "intervalMs" IS NULL
         AND "nextReviewAt" IS NOT NULL
         AND "lastReviewedAt" IS NOT NULL`,
    );
  }

  // The backfill cannot be undone selectively (backfilled and fresh rows are
  // indistinguishable afterwards), so down() is a no-op.
  public async down(): Promise<void> {}
}
