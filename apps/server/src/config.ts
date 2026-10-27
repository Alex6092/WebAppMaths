import { existsSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export interface Config {
  port: number;
  host: string;
  dataDir: string;
  /** Chemin sous lequel l'app est servie, avec / au début et à la fin (« /apprendre/ »). */
  basePath: string;
  /** URL publique (https://…) : sert à vérifier l'en-tête Origin. */
  publicUrl: string | null;
  trustProxy: boolean | string;
  cookieSecure: boolean;
  webDist: string | null;
  version: string;
  /** Code d'invitation administrateur fixe (dev et tests de bout en bout seulement). */
  adminInviteCode: string | null;
  backupKeep: number;
  logLevel: string;
  /** Piper et ses voix (deploy/piper.sh) : piper/ et voices/. À côté de data/ par défaut. */
  ttsDir: string;
  /** Le nombre de phrases fabriquées en même temps (un cœur chacune). */
  ttsWorkers: number;
  /** La taille du cache des phrases, en Mo. */
  ttsCacheMb: number;
}

export function normalizeBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? '/').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/** « true », « false », ou une liste d'adresses du reverse proxy (« 10.0.0.5,10.0.0.6 »). */
function parseTrustProxy(raw: string | undefined): boolean | string {
  if (!raw || raw === 'false') return false;
  if (raw === 'true') return true;
  return raw;
}

function readVersion(): string {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  for (const file of [join(process.cwd(), 'VERSION'), resolve(here, '../../../VERSION')]) {
    if (existsSync(file)) return readFileSync(file, 'utf8').trim();
  }
  return 'dev';
}

function findWebDist(): string | null {
  const candidates = [process.env.WEB_DIST, resolve(here, '../../web/dist')].filter(
    Boolean,
  ) as string[];
  return candidates.find((dir) => existsSync(join(dir, 'index.html'))) ?? null;
}

export function loadConfig(env = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const dataDir = resolve(env.DATA_DIR ?? 'data');
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? '127.0.0.1',
    dataDir,
    basePath: normalizeBasePath(env.BASE_PATH),
    publicUrl: env.PUBLIC_URL ? new URL(env.PUBLIC_URL).origin : null,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : production,
    webDist: findWebDist(),
    version: readVersion(),
    adminInviteCode: env.ADMIN_INVITE_CODE ?? null,
    backupKeep: Number(env.BACKUP_KEEP ?? 14),
    logLevel: env.LOG_LEVEL ?? 'info',
    ttsDir: resolve(env.TTS_DIR ?? join(dataDir, '..', 'piper')),
    // Un cœur pour l'app, les autres pour les voix (3 au plus).
    ttsWorkers: Number(env.TTS_WORKERS ?? Math.max(1, Math.min(3, cpus().length - 1))),
    ttsCacheMb: Number(env.TTS_CACHE_MB ?? 500),
  };
}
