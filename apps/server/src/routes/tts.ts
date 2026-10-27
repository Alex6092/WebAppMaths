import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/session';
import { HttpError } from '../errors';
import { TtsBusyError } from '../tts/pool';
import { MAX_TEXT, VOICES, type VoiceId } from '../tts/service';
import type { Deps } from './deps';

interface SpeakBody {
  voice: VoiceId;
  text: string;
}

const unavailable = (message: string) => new HttpError(503, 'tts_unavailable', message);

/**
 * POST /api/tts { voice, text } : le son de la phrase (WAV). Réservé aux comptes connectés.
 * Le texte voyage dans le corps de la requête, pas dans l'adresse : il ne finit pas dans les
 * journaux du reverse proxy. Sur 503, l'app se rabat sur la voix du navigateur.
 */
export function ttsRoutes(api: FastifyInstance, { tts }: Deps): void {
  api.post<{ Body: SpeakBody }>(
    '/tts',
    {
      schema: {
        body: {
          type: 'object',
          required: ['voice', 'text'],
          additionalProperties: false,
          properties: {
            voice: { enum: Object.keys(VOICES) },
            text: { type: 'string', minLength: 1, maxLength: MAX_TEXT },
          },
        },
      },
      // Une phrase par question à peu près : 120 par minute laisse de la marge à une famille.
      config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      requireAuth(req);
      if (!tts) throw unavailable('La voix du serveur n’est pas installée.');
      let audio: Buffer;
      try {
        audio = await tts.speak(req.body.voice, req.body.text);
      } catch (error) {
        if (error instanceof TtsBusyError) throw unavailable('La voix du serveur est occupée.');
        req.log.error(error, 'Voix : fabrication impossible');
        throw unavailable('La voix du serveur n’a pas pu lire cette phrase.');
      }
      return reply
        .header('Content-Type', 'audio/wav')
        .header('Cache-Control', 'private, max-age=86400')
        .send(audio);
    },
  );
}
