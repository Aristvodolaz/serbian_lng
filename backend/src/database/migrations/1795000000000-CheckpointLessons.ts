import { MigrationInterface, QueryRunner } from 'typeorm';

// Checkpoint lessons: kind ('regular' | 'checkpoint'), nullable unitId — a
// checkpoint belongs to a section, not a unit — and a nullable sectionId.
// The old composite unique (unitId, title) is replaced by partial unique
// indexes, because a checkpoint has no unit and must be unique per section.
export class CheckpointLessons1795000000000 implements MigrationInterface {
  name = 'CheckpointLessons1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "kind" varchar NOT NULL DEFAULT 'regular'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ALTER COLUMN "unitId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "sectionId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_lessons_section" ON "lessons" ("sectionId")`,
    );
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'FK_lessons_section'
         ) THEN
           ALTER TABLE "lessons" ADD CONSTRAINT "FK_lessons_section"
             FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE;
         END IF;
       END $$`,
    );

    // Drop the synchronize-era composite unique (unitId, title) — its name is
    // a TypeORM hash, so locate it by columns instead of by name.
    await queryRunner.query(
      `DO $$
       DECLARE
         constraint_name varchar;
       BEGIN
         SELECT c.conname INTO constraint_name
         FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE c.contype = 'u'
           AND t.relname = 'lessons'
           AND n.nspname = current_schema()
           AND (SELECT count(*) = 2
                FROM unnest(c.conkey) k
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k
                WHERE a.attname IN ('unitId', 'title'));
         IF constraint_name IS NOT NULL THEN
           EXECUTE format('ALTER TABLE "lessons" DROP CONSTRAINT %I', constraint_name);
         END IF;
       END $$`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_lessons_unit_title"
       ON "lessons" ("unitId", "title") WHERE "unitId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_lessons_section_title_checkpoint"
       ON "lessons" ("sectionId", "title") WHERE "kind" = 'checkpoint'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_lessons_section_title_checkpoint"`,
    );
    // Checkpoints have no unit and cannot be mapped into the pre-checkpoint
    // shape — they are removed before the "kind" column is dropped.
    await queryRunner.query(`DELETE FROM "lessons" WHERE "kind" = 'checkpoint'`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_lessons_unit_title"`);
    // Restore the composite unique for the pre-checkpoint entity shape.
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'UQ_lessons_unit_title_regular'
         ) THEN
           ALTER TABLE "lessons" ADD CONSTRAINT "UQ_lessons_unit_title_regular"
             UNIQUE ("unitId", "title");
         END IF;
       END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "FK_lessons_section"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lessons_section"`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "sectionId"`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "kind"`);
    // min(id) over an empty "units" table yields NULL, which would fail the
    // SET NOT NULL with a misleading type error — fail loudly instead.
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM "units" LIMIT 1) THEN
           RAISE EXCEPTION 'Cannot revert CheckpointLessons: "units" is empty but lessons still reference units';
         END IF;
         UPDATE "lessons" SET "unitId" = (SELECT min("id") FROM "units") WHERE "unitId" IS NULL;
       END $$`,
    );
    await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "unitId" SET NOT NULL`);
  }
}
