import * as path from 'path';
import { DataSource } from 'typeorm';

// CLI DataSource for running migrations against a running Postgres:
//   npm run migration:run    (DATABASE_URL must be set, e.g. via .env)
// Dev boot still uses TYPEORM_SYNCHRONIZE; these are for the day the schema
// stops being auto-created (shared/production database).
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
});
