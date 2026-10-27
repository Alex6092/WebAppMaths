import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import type { Config } from '../config';
import { TtsCache } from './cache';
import { TtsPool, type PoolOptions } from './pool';

/**
 * La voix du serveur : Piper fabrique chaque phrase (consignes, dictées, anglais) avec une voix
 * de qualité, la même sur tous les appareils. Les voix sont installées au déploiement
 * (deploy/piper.sh) ; sans elles, l'app garde la voix du navigateur.
 */

/** Les voix Piper (licence CC BY 4.0), par langue. */
export const VOICES = { fr: 'fr_FR-siwis-medium', en: 'en_GB-alba-medium' } as const;
export type VoiceId = keyof typeof VOICES;

/** Une phrase au plus : au-delà, ce n'est plus une consigne. */
export const MAX_TEXT = 400;

/**
 * Le texte tel qu'il faut le dire : sans les emoji, et les verbes de consigne en majuscules
 * (« COCHE », « ÉCOUTE ») en minuscules pour qu'ils ne soient pas épelés. Les noms de points
 * (A, AB) restent en majuscules.
 */
export function speechText(text: string): string {
  return text
    .replace(
      /\p{Extended_Pictographic}|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF}|\u200d|\ufe0f/gu,
      '',
    )
    .replace(/(?<!\p{L})\p{Lu}{3,}(?!\p{L})/gu, (word) => word.toLowerCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export class TtsService {
  /** Les phrases en cours de fabrication : deux enfants qui demandent la même attendent la même. */
  private readonly pending = new Map<string, Promise<Buffer>>();
  private readonly pruneTimer: NodeJS.Timeout;

  constructor(
    private readonly pool: TtsPool,
    private readonly cache: TtsCache,
    private readonly log?: FastifyBaseLogger,
  ) {
    const prune = () =>
      void this.cache
        .prune()
        .then((n) => n && this.log?.info(`Voix : ${n} phrases effacées du cache.`))
        .catch((error) => this.log?.warn(error, 'Voix : ménage du cache impossible.'));
    prune();
    this.pruneTimer = setInterval(prune, 6 * 3600_000);
    this.pruneTimer.unref();
  }

  get load() {
    return this.pool.load;
  }

  /** Le son de la phrase (WAV), depuis le cache ou fabriqué. */
  async speak(voice: VoiceId, text: string): Promise<Buffer> {
    const said = speechText(text);
    if (!said) throw new Error('Rien à dire.');
    const key = createHash('sha256').update(`${VOICES[voice]}\n${said}`).digest('hex');
    const cached = await this.cache.get(key);
    if (cached) return cached;
    const running = this.pending.get(key);
    if (running) return running;
    const made = this.pool
      .synth(voice, said)
      .then(async (audio) => {
        await this.cache.put(key, audio);
        return audio;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, made);
    return made;
  }

  close(): void {
    clearInterval(this.pruneTimer);
    this.pool.close();
  }
}

/** Le service de voix, ou null si Piper et ses voix ne sont pas installés dans config.ttsDir. */
export function createTts(
  config: Config,
  log?: FastifyBaseLogger,
  pool?: Partial<PoolOptions>,
): TtsService | null {
  const dir = config.ttsDir;
  const command = join(dir, 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper');
  const models = Object.fromEntries(
    Object.entries(VOICES).map(([id, name]) => [id, join(dir, 'voices', `${name}.onnx`)]),
  );
  const missing = [pool?.command ?? command, ...Object.values(models)].filter(
    (f) => !existsSync(f),
  );
  if (missing.length) {
    log?.info(`Voix du serveur absente (${missing[0]}) : l’app garde la voix du navigateur.`);
    return null;
  }
  return new TtsService(
    new TtsPool({
      command,
      models,
      workers: config.ttsWorkers,
      queueMax: 50,
      timeoutMs: 15_000,
      tmpDir: join(config.dataDir, 'tts', 'tmp'),
      ...pool,
    }),
    new TtsCache(join(config.dataDir, 'tts', 'cache'), config.ttsCacheMb * 1024 * 1024),
    log,
  );
}
