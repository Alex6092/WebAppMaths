import { defineConfig } from 'drizzle-kit';

// `npm run db:generate -w @app/server` crée une migration SQL dans drizzle/
// à partir des changements de src/db/schema.ts. Les migrations s'appliquent au démarrage.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
