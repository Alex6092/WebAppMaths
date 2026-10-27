import { mkdir, readdir, readFile, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Le cache des phrases déjà fabriquées, sur le disque : une consigne qui revient (« COCHE le bon
 * jour. ») est servie aussitôt. La date du fichier est celle de sa dernière écoute : au-delà de
 * la taille permise, on efface les moins écoutées.
 */
export class TtsCache {
  constructor(
    private readonly dir: string,
    private readonly maxBytes: number,
  ) {}

  private path(key: string): string {
    return join(this.dir, key.slice(0, 2), `${key}.wav`);
  }

  async get(key: string): Promise<Buffer | null> {
    const file = this.path(key);
    try {
      const audio = await readFile(file);
      const now = new Date();
      await utimes(file, now, now).catch(() => {});
      return audio;
    } catch {
      return null;
    }
  }

  async put(key: string, audio: Buffer): Promise<void> {
    const file = this.path(key);
    await mkdir(join(this.dir, key.slice(0, 2)), { recursive: true });
    // Écrit à côté puis renomme : une lecture en même temps ne voit jamais un fichier à moitié écrit.
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, audio);
    await rename(tmp, file);
  }

  /** Efface les phrases les moins écoutées jusqu'à revenir à 80 % de la taille permise. */
  async prune(): Promise<number> {
    const files: { path: string; size: number; used: number }[] = [];
    let dirs: string[];
    try {
      dirs = await readdir(this.dir);
    } catch {
      return 0;
    }
    for (const sub of dirs) {
      let names: string[];
      try {
        names = await readdir(join(this.dir, sub));
      } catch {
        continue;
      }
      for (const name of names) {
        const path = join(this.dir, sub, name);
        const info = await stat(path).catch(() => null);
        if (info?.isFile()) files.push({ path, size: info.size, used: info.mtimeMs });
      }
    }
    let total = files.reduce((sum, f) => sum + f.size, 0);
    if (total <= this.maxBytes) return 0;
    let removed = 0;
    for (const file of files.sort((a, b) => a.used - b.used)) {
      if (total <= this.maxBytes * 0.8) break;
      await rm(file.path, { force: true });
      total -= file.size;
      removed++;
    }
    return removed;
  }
}
