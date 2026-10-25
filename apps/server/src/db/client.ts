import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const here = dirname(fileURLToPath(import.meta.url));

/** Dossier des migrations : dist/drizzle une fois construit, apps/server/drizzle en dev. */
function migrationsFolder(): string {
  const candidates = [
    join(here, 'drizzle'),
    join(here, '..', 'drizzle'),
    join(here, '..', '..', 'drizzle'),
  ];
  const found = candidates.find((dir) => existsSync(join(dir, 'meta', '_journal.json')));
  if (!found) throw new Error('Dossier des migrations introuvable');
  return found;
}

export function openDb(file: string, options: { migrate?: boolean } = {}): Db {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');
  const db = drizzle(sqlite, { schema }) as Db;
  if (options.migrate !== false) migrate(db, { migrationsFolder: migrationsFolder() });
  return db;
}
