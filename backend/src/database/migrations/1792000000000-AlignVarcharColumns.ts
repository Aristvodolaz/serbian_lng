import { MigrationInterface, QueryRunner } from 'typeorm';

// ContentPayloadSchema1790000000000 created its varchar columns with an
// explicit length (character varying(255)), but every entity declares them
// as plain @Column()/varchar with no length. TypeORM's synchronize treats
// DB length "255" vs entity length "" as a difference and recreates the
// column (DROP + ADD NOT NULL), which Postgres rejects with "column X
// contains null values" and crash-loops the app at boot. Drop the explicit
// length so the migrated schema matches what TypeORM itself would create.
export class AlignVarcharColumns1792000000000 implements MigrationInterface {
  name = 'AlignVarcharColumns1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const statement of [
      `ALTER TABLE "exercises" ALTER COLUMN "type" TYPE character varying`,
      `ALTER TABLE "exercises" ALTER COLUMN "status" TYPE character varying`,
      `ALTER TABLE "lessons" ALTER COLUMN "status" TYPE character varying`,
      `ALTER TABLE "units" ALTER COLUMN "status" TYPE character varying`,
      `ALTER TABLE "units" ALTER COLUMN "icon" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "status" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "partOfSpeech" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "gender" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "number" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "declension" TYPE character varying`,
      `ALTER TABLE "words" ALTER COLUMN "conjugation" TYPE character varying`,
    ]) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-adding the explicit length would reintroduce the synchronize
    // mismatch this migration exists to fix; nothing to restore.
  }
}
