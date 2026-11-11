import { MigrationInterface, QueryRunner } from 'typeorm';

// Theory topics: grammar theory attached to a section (no exercises, no
// progress, never gated). Guarded (IF NOT EXISTS) to stay idempotent against
// a schema already reconciled by TYPEORM_SYNCHRONIZE.
export class CreateTheoryTopics1798000000000 implements MigrationInterface {
  name = 'CreateTheoryTopics1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "theory_topics" (
         "id" uuid NOT NULL DEFAULT gen_random_uuid(),
         "sectionId" uuid NOT NULL,
         "titleCyrillic" varchar NOT NULL,
         "titleLatin" varchar NOT NULL DEFAULT '',
         "titleTranslationRu" text NOT NULL DEFAULT '',
         "titleTranslationEn" text NOT NULL DEFAULT '',
         "payload" jsonb NOT NULL,
         "status" varchar NOT NULL DEFAULT 'DRAFT',
         "order" integer NOT NULL,
         CONSTRAINT "PK_theory_topics" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_theory_section" ON "theory_topics" ("sectionId")`,
    );
    // Guards the createTheory max(order)+1 race: a duplicate insert fails and retries.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_theory_section_order" ON "theory_topics" ("sectionId", "order")`,
    );
    await queryRunner.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'FK_theory_section'
         ) THEN
           ALTER TABLE "theory_topics" ADD CONSTRAINT "FK_theory_section"
             FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE;
         END IF;
       END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "theory_topics" DROP CONSTRAINT IF EXISTS "FK_theory_section"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_theory_section_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_theory_section"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "theory_topics"`);
  }
}
