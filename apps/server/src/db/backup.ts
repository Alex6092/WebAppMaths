import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './client';

function stamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-');
}

/** Sauvegarde à chaud (API de sauvegarde SQLite, compatible avec le mode WAL). */
export async function backupDatabase(db: Db, dir: string, label: string): Promise<string> {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `app-${stamp()}-${label}.db`);
  await db.$client.backup(file);
  return file;
}

/** Garde les `keep` sauvegardes les plus récentes portant ce libellé. */
export function pruneBackups(dir: string, label: string, keep: number): string[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('app-') && f.endsWith(`-${label}.db`))
    .sort();
  const removed = files.slice(0, Math.max(0, files.length - keep));
  for (const f of removed) rmSync(join(dir, f));
  return removed;
}

/** Une sauvegarde « daily » par jour, vérifiée au démarrage puis toutes les heures. */
export function scheduleDailyBackups(
  db: Db,
  dir: string,
  keep: number,
  log: { info: (msg: string) => void; error: (msg: string) => void },
): NodeJS.Timeout {
  const run = async () => {
    const today = stamp().slice(0, 8);
    const done =
      existsSync(dir) &&
      readdirSync(dir).some((f) => f.startsWith(`app-${today}`) && f.endsWith('-daily.db'));
    if (done) return;
    try {
      const file = await backupDatabase(db, dir, 'daily');
      pruneBackups(dir, 'daily', keep);
      log.info(`Sauvegarde quotidienne : ${file}`);
    } catch (error) {
      log.error(`Échec de la sauvegarde quotidienne : ${(error as Error).message}`);
    }
  };
  void run();
  const timer = setInterval(run, 60 * 60 * 1000);
  timer.unref();
  return timer;
}
