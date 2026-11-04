import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { migrateSafely, migrationsFolder, type Db } from './client';
import * as schema from './schema';

let dir = '';
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

/** Un dossier de migrations qui s'arrête à la migration n° last. */
function migrationsUpTo(last: number): string {
  const src = migrationsFolder();
  const out = join(dir, 'drizzle');
  mkdirSync(join(out, 'meta'), { recursive: true });
  const journal = JSON.parse(readFileSync(join(src, 'meta', '_journal.json'), 'utf8')) as {
    entries: { idx: number; tag: string }[];
  };
  journal.entries = journal.entries.filter((e) => e.idx <= last);
  for (const e of journal.entries)
    copyFileSync(join(src, `${e.tag}.sql`), join(out, `${e.tag}.sql`));
  writeFileSync(join(out, 'meta', '_journal.json'), JSON.stringify(journal));
  return out;
}

it('la migration des écoles garde les familles, les enfants et leurs réponses', () => {
  dir = mkdtempSync(join(tmpdir(), 'wam-migration-'));
  const sqlite = new Database(join(dir, 'app.db'));
  const db = drizzle(sqlite, { schema }) as Db;
  migrateSafely(db, migrationsUpTo(3));
  sqlite.pragma('foreign_keys = ON');
  const now = Date.now();
  const run = (q: string, ...args: unknown[]) => sqlite.prepare(q).run(...args);
  run(`insert into family (id, name, created_at) values (1, 'F', ?)`, now);
  run(
    `insert into parent_user (id, family_id, email, password_hash, role, created_at)
     values (1, 1, 'a@example.org', 'x', 'admin', ?)`,
    now,
  );
  run(
    `insert into child (id, family_id, first_name, avatar, grade, theme_id, created_at)
     values (1, 1, 'Léa', '🦄', 'CE1', 'foret', ?)`,
    now,
  );
  run(
    `insert into auth_session (id, family_id, parent_user_id, active_child_id, created_at, last_seen_at, expires_at)
     values ('s', 1, 1, 1, ?, ?, ?)`,
    now,
    now + 5000,
    now + 1e9,
  );
  run(
    `insert into practice_session (id, child_id, mode, selection, started_at) values (1, 1, 'training', '{}', ?)`,
    now,
  );
  run(
    `insert into attempt (session_id, child_id, plugin_id, plugin_version, level, seed, answers,
       first_try_correct, solved, tries, score, duration_ms, coins, created_at)
     values (1, 1, 'p', 1, 1, 42, '[]', 1, 1, 1, 1, 1000, 1, ?)`,
    now,
  );
  run(
    `insert into assignment (child_id, title, notions, questions, due_on, created_at)
     values (1, 'D', '[]', 5, '2026-11-10', ?)`,
    now,
  );

  migrateSafely(db, migrationsFolder());
  sqlite.pragma('foreign_keys = ON');
  const count = (table: string) =>
    (sqlite.prepare(`select count(*) as n from ${table}`).get() as { n: number }).n;
  for (const table of ['family', 'parent_user', 'child', 'auth_session', 'attempt', 'assignment'])
    expect(count(table), table).toBe(1);
  expect(sqlite.prepare('select active_child_id as c from auth_session').get()).toEqual({ c: 1 });
  // La dernière activité d'un compte existant : celle de sa session la plus récente.
  expect(sqlite.prepare('select last_seen_at as t from parent_user').get()).toEqual({
    t: now + 5000,
  });

  // Les nouvelles références suppriment bien en cascade (ou se vident).
  run(`insert into school (id, name, created_at) values (1, 'École', ?)`, now);
  run(
    `insert into classroom (id, school_id, name, grades, school_year, created_at)
     values (1, 1, 'CE1', '["CE1"]', '2026-2027', ?)`,
    now,
  );
  run(`update assignment set class_id = 1, batch = 'b'`);
  run(
    `insert into invitation (code_hash, role, child_id, school_id, created_at, expires_at)
     values ('h', 'eleve', 1, 1, ?, ?)`,
    now,
    now + 1e9,
  );
  run(`delete from classroom where id = 1`);
  expect(sqlite.prepare('select class_id as c from assignment').get()).toEqual({ c: null });
  run(`delete from child where id = 1`);
  expect(count('invitation')).toBe(0);
  expect(count('attempt')).toBe(0);
  sqlite.close();
});
