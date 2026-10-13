import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates user_exercise_answers: one row per (user, exercise) — the LAST
// attempt, keyed by the unique (userId, exerciseId) constraint. Feeds
// server-side lesson scoring in completeLesson (first attempt = attemptNumber 1).
// Guarded (IF NOT EXISTS) so it also runs cleanly against a schema already
// reconciled by TYPEORM_SYNCHRONIZE.
export class CreateUserExerciseAnswers1793000000000 implements MigrationInterface {
  name = 'CreateUserExerciseAnswers1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_exercise_answers" (
         "id" uuid NOT NULL DEFAULT gen_random_uuid(),
         "userId" uuid NOT NULL,
         "exerciseId" uuid NOT NULL,
         "lessonId" uuid NOT NULL,
         "correct" boolean NOT NULL,
         "attemptNumber" integer NOT NULL,
         "answeredAt" timestamptz NOT NULL DEFAULT now(),
         CONSTRAINT "PK_user_exercise_answers" PRIMARY KEY ("id"),
         CONSTRAINT "FK_user_exercise_answers_user" FOREIGN KEY ("userId")
           REFERENCES "users" ("id") ON DELETE CASCADE,
         CONSTRAINT "FK_user_exercise_answers_exercise" FOREIGN KEY ("exerciseId")
           REFERENCES "exercises" ("id") ON DELETE CASCADE,
         CONSTRAINT "FK_user_exercise_answers_lesson" FOREIGN KEY ("lessonId")
           REFERENCES "lessons" ("id") ON DELETE CASCADE
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_exercise_answers_user_exercise"
       ON "user_exercise_answers" ("userId", "exerciseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_exercise_answers_user_lesson"
       ON "user_exercise_answers" ("userId", "lessonId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_exercise_answers"`);
  }
}
