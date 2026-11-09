import { MigrationInterface, QueryRunner } from 'typeorm';

// Creates sections (chapters above units, CEFR level + order) and links every
// existing unit to a single default section 'Основе' (A1, order 0), so the
// legacy content renders as one section instead of falling into the
// no-section tail. Guarded (IF NOT EXISTS) so it also runs cleanly against a
// schema already reconciled by TYPEORM_SYNCHRONIZE.
export class CreateSectionsAndLinkUnits1794000000000 implements MigrationInterface {
  name = 'CreateSectionsAndLinkUnits1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "sections" (
         "id" uuid NOT NULL DEFAULT gen_random_uuid(),
         "titleCyrillic" varchar NOT NULL,
         "titleLatin" varchar NOT NULL DEFAULT '',
         "titleTranslationRu" text NOT NULL DEFAULT '',
         "titleTranslationEn" text NOT NULL DEFAULT '',
         "level" varchar NOT NULL DEFAULT 'A1',
         "status" varchar NOT NULL DEFAULT 'DRAFT',
         "order" integer NOT NULL,
         CONSTRAINT "PK_sections" PRIMARY KEY ("id"),
         CONSTRAINT "UQ_sections_titleCyrillic" UNIQUE ("titleCyrillic")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "sectionId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_units_section" ON "units" ("sectionId")`,
    );
    // Postgres has no ADD CONSTRAINT IF NOT EXISTS — guard via a catalog check.
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'FK_units_section'
         ) THEN
           ALTER TABLE "units" ADD CONSTRAINT "FK_units_section"
             FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL;
         END IF;
       END $$`,
    );

    // Backfill: one default section holding all existing units.
    await queryRunner.query(
      `INSERT INTO "sections" ("titleCyrillic", "titleLatin", "titleTranslationRu", "titleTranslationEn", "level", "status", "order")
       SELECT 'Основе', 'Osnove', 'Основы', 'Foundations', 'A1', 'DRAFT', 0
       WHERE NOT EXISTS (SELECT 1 FROM "sections" WHERE "titleCyrillic" = 'Основе')`,
    );
    await queryRunner.query(
      `UPDATE "units" SET "sectionId" = (
         SELECT "id" FROM "sections" WHERE "titleCyrillic" = 'Основе' LIMIT 1
       )
       WHERE "sectionId" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "units" DROP CONSTRAINT IF EXISTS "FK_units_section"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_units_section"`);
    await queryRunner.query(`ALTER TABLE "units" DROP COLUMN IF EXISTS "sectionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sections"`);
  }
}
