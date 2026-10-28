import { storySpeechTexts } from '@app/content';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { sql } from 'drizzle-orm';
import Fastify, { type FastifyError } from 'fastify';
import { SESSION_COOKIE, SessionStore } from './auth/session';
import type { Config } from './config';
import type { Db } from './db/client';
import { HttpError } from './errors';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { childRoutes } from './routes/child';
import type { Deps } from './routes/deps';
import { familyRoutes } from './routes/family';
import { ttsRoutes } from './routes/tts';
import { createTts, type TtsService } from './tts/service';
import { warmSpeech } from './tts/warm';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface AppOptions {
  logger?: boolean;
  /** La voix du serveur ; par défaut, celle installée dans config.ttsDir (s'il y en a une). */
  tts?: TtsService | null;
  /** Prépare en arrière-plan le son des histoires à écouter (au démarrage du vrai serveur). */
  warmSpeech?: boolean;
}

export async function buildApp(config: Config, db: Db, options: AppOptions = {}) {
  const app = Fastify({
    logger: options.logger === false ? false : { level: config.logLevel },
    trustProxy: config.trustProxy,
    bodyLimit: 64 * 1024,
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        // Les phrases lues par la voix du serveur sont jouées depuis une URL blob:.
        mediaSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: config.cookieSecure ? [] : null,
      },
    },
    hsts: config.cookieSecure,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyRateLimit, {
    global: true,
    max: 600,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'too_many_requests',
      message: `Trop d’essais. Réessaie dans ${Math.max(1, Math.ceil(context.ttl / 60000))} minute(s).`,
    }),
  });

  app.setErrorHandler((error: FastifyError | HttpError, req, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.status).send({ error: error.code, message: error.message });
    }
    if (error.validation) {
      return reply.code(400).send({ error: 'invalid_request', message: error.message });
    }
    const status = error.statusCode ?? 500;
    if (status < 500) {
      const code = (error as unknown as { error?: unknown }).error;
      return reply
        .code(status)
        .send({ error: typeof code === 'string' ? code : 'bad_request', message: error.message });
    }
    req.log.error(error);
    return reply.code(500).send({ error: 'internal', message: 'Erreur interne du serveur.' });
  });

  const sessions = new SessionStore(db);
  const tts = options.tts !== undefined ? options.tts : createTts(config, app.log);
  const warming = new AbortController();
  app.addHook('onClose', async () => {
    warming.abort();
    tts?.close();
  });
  if (tts && options.warmSpeech) {
    app.addHook('onReady', async () => {
      void warmSpeech(tts, 'fr', storySpeechTexts(), { log: app.log, signal: warming.signal });
    });
  }
  const deps: Deps = { db, config, sessions, tts };

  await app.register(
    async (api) => {
      api.decorateRequest('auth', null);

      // Protection CSRF : une requête qui modifie quelque chose doit venir de l'app elle-même.
      api.addHook('onRequest', async (req, reply) => {
        const origin = req.headers.origin;
        if (SAFE_METHODS.has(req.method) || !origin) return;
        const expected = config.publicUrl ?? `${req.protocol}://${req.host}`;
        if (origin !== expected) {
          return reply.code(403).send({ error: 'bad_origin', message: 'Origine refusée.' });
        }
      });

      api.addHook('onRequest', async (req) => {
        const token = req.cookies[SESSION_COOKIE];
        req.auth = token ? sessions.load(token) : null;
      });

      api.get('/health', async () => {
        db.get(sql`select 1`);
        return { status: 'ok', version: config.version, tts: tts ? 'on' : 'off' };
      });

      authRoutes(api, deps);
      familyRoutes(api, deps);
      childRoutes(api, deps);
      adminRoutes(api, deps);
      ttsRoutes(api, deps);
    },
    { prefix: `${config.basePath}api` },
  );

  if (config.webDist) {
    await app.register(fastifyStatic, {
      root: config.webDist,
      prefix: config.basePath,
      cacheControl: false,
      setHeaders(res, path) {
        // Les fichiers de assets/ portent une empreinte dans leur nom : cache long. index.html : jamais en cache.
        res.setHeader(
          'Cache-Control',
          /[\\/]assets[\\/]/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    });
  }

  return app;
}
