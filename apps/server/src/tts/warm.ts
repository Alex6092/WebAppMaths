import type { FastifyBaseLogger } from 'fastify';
import type { TtsService, VoiceId } from './service';

export interface WarmOptions {
  log?: FastifyBaseLogger;
  /** Arrête la préparation (le serveur s'arrête). */
  signal?: AbortSignal;
  /** Attente quand la voix sert déjà quelqu'un, avant de réessayer. */
  idleMs?: number;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Prépare à l'avance le son de phrases connues (les histoires à écouter) : la première écoute
 * d'une histoire ne fait pas attendre l'enfant, et la voix ne change pas en cours de route. Une
 * phrase à la fois, seulement quand la voix n'a personne d'autre à servir ; celles déjà dans le
 * cache sont passées. Renvoie le nombre de phrases fabriquées.
 */
export async function warmSpeech(
  tts: TtsService,
  voice: VoiceId,
  texts: readonly string[],
  { log, signal, idleMs = 2000 }: WarmOptions = {},
): Promise<number> {
  let made = 0;
  for (const text of new Set(texts)) {
    if (signal?.aborted) break;
    if (await tts.has(voice, text)) continue;
    while (!signal?.aborted && (tts.load.running > 0 || tts.load.waiting > 0)) await pause(idleMs);
    if (signal?.aborted) break;
    try {
      await tts.speak(voice, text);
      made++;
    } catch (error) {
      if (signal?.aborted) break;
      log?.warn(error, `Voix : préparation impossible de « ${text.slice(0, 40)}… »`);
    }
  }
  if (made) log?.info(`Voix : ${made} phrases d’histoires préparées à l’avance.`);
  return made;
}
