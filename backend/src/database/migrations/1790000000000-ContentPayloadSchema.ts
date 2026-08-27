import { MigrationInterface, QueryRunner } from 'typeorm';

// Brings the content tables to the payload-era shape:
//   exercises  type enum -> varchar, +payload(jsonb)/status, prompt_* dropped
//   lessons    +descriptionRu/En, +minExercises, +status
//   units      +status, +icon
//   words      -unitId (Word is global now), +partOfSpeech/gender/number/
//              declension/conjugation/imageUrl, +status
//   exercise_choices dropped, exercises_type_enum dropped.
//
// Destructive by design: this project is in its infancy and content is
// authored through the admin panel / CSV upload, so legacy exercise rows
// (now payload='{}', status=draft) are expected to be re-authored, not
// migrated. Statements are guarded (IF EXISTS / IF NOT EXISTS) so the
// migration also runs cleanly against a schema already reconciled by
// TYPEORM_SYNCHRONIZE.
export class ContentPayloadSchema1790000000000 implements MigrationInterface {
  name = 'ContentPayloadSchema1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // exercises.type: Postgres enum -> plain varchar. New exercise types are
    // registry entries, never DB migrations.
    await queryRunner.query(`ALTER TABLE "exercises" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "type" TYPE character varying(255) USING "type"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ALTER COLUMN "type" SET DEFAULT 'translation_choice'`,
    );
    // Type renames from the legacy registry.
    await queryRunner.query(
      `UPDATE "exercises" SET "type" = 'translation_choice' WHERE "type" = 'translate_choice'`,
    );
    await queryRunner.query(
      `UPDATE "exercises" SET "type" = 'fill_word' WHERE "type" = 'fill_blank'`,
    );

    await queryRunner.query(
      `ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "payload" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "status" character varying(255) NOT NULL DEFAULT 'draft'`,
    );

    // Dropping promptCyrillic also drops the legacy UNIQUE(lessonId, promptCyrillic).
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "promptCyrillic"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "promptLatin"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "promptTranslationRu"`);
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "promptTranslationEn"`);

    // Order is now unique per lesson (mirrors @Unique(['lessonId','order'])).
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conrelid = 'exercises'::regclass
             AND contype = 'u'
             AND conkey = ARRAY[
               (SELECT attnum FROM pg_attribute WHERE attrelid = 'exercises'::regclass AND attname = 'lessonId'),
               (SELECT attnum FROM pg_attribute WHERE attrelid = 'exercises'::regclass AND attname = 'order')
             ]
         ) THEN
           ALTER TABLE "exercises" ADD CONSTRAINT "UQ_exercises_lesson_order" UNIQUE ("lessonId", "order");
         END IF;
       END $$`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "exercise_choices"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "exercises_type_enum"`);

    // words: Word is global (no unitId) and carries part-of-speech metadata.
    await queryRunner.query(`ALTER TABLE "words" DROP COLUMN IF EXISTS "unitId"`);
    await queryRunner.query(
      `ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "partOfSpeech" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "gender" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "number" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "declension" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "conjugation" character varying(255)`,
    );
    await queryRunner.query(`ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "imageUrl" text`);
    await queryRunner.query(
      `ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "status" character varying(255) NOT NULL DEFAULT 'draft'`,
    );

    // lessons / units: publish-workflow fields.
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "descriptionRu" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "descriptionEn" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "minExercises" integer NOT NULL DEFAULT 5`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "status" character varying(255) NOT NULL DEFAULT 'draft'`,
    );

    await queryRunner.query(
      `ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "status" character varying(255) NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(`ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "icon" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Destructive migration: legacy exercise content is not recoverable
    // (prompt_* columns and exercise_choices are gone). Rebuilding the old
    // schema from here would be fiction — reset the DB instead.
  }
}
