import { normalizeIP } from '@fastify/rate-limit';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { HttpError } from '../errors';

/**
 * Limites de requêtes compatibles avec une école : tous ses postes (et les parents sur son Wi-Fi)
 * sortent souvent par la même adresse IP. On compte donc par appareil connecté, par compte, et
 * seulement en dernier recours par adresse IP.
 */

export const AUTH_WINDOW = '15 minutes';

/** L'adresse du client (IPv6 regroupées par /64, comme le fait le plugin). */
export const ipOf = (req: FastifyRequest): string => normalizeIP(req.ip);

/**
 * Un appareil connecté (session valide, chargée par le hook onRequest de l'API) a son propre
 * quota ; sinon, celui de son adresse. Un cookie inventé n'ouvre pas de session : il retombe sur
 * l'adresse.
 */
export const clientKey = (req: FastifyRequest): string =>
  req.auth ? `session:${req.auth.sessionId}` : `ip:${ipOf(req)}`;

export const tooManyAttempts = (ttlMs: number) =>
  new HttpError(
    429,
    'too_many_requests',
    `Trop d’essais. Réessaie dans ${Math.max(1, Math.ceil(ttlMs / 60000))} minute(s).`,
  );

/**
 * Un garde à placer en preHandler (le corps est déjà validé : on peut y lire l'e-mail) : un seul
 * compteur, partagé par toutes les routes qui l'utilisent.
 */
export function createGuard(
  api: FastifyInstance,
  options: { max: number; timeWindow?: string; keyOf: (req: FastifyRequest) => string },
) {
  const limit = api.createRateLimit({
    max: options.max,
    timeWindow: options.timeWindow ?? AUTH_WINDOW,
    keyGenerator: options.keyOf,
  });
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = await limit(req);
    if (result.isAllowed || !result.isExceeded) return;
    reply.header('retry-after', result.ttlInSeconds);
    throw tooManyAttempts(result.ttl);
  };
}
