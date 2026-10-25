import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../auth/crypto';
import { requireAuth, SESSION_COOKIE, SESSION_TTL_MS } from '../auth/session';
import { families, invitations, parentUsers } from '../db/schema';
import { badRequest, conflict, HttpError } from '../errors';
import { buildMe, getFamilyChild } from '../services/family';
import { findUsableInvitation } from '../services/invitations';
import type { Deps } from './deps';

const EMAIL = {
  type: 'string',
  maxLength: 200,
  pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
} as const;
const PASSWORD = { type: 'string', minLength: 8, maxLength: 200 } as const;
// Connexion, inscription, déverrouillage : 10 essais par quart d'heure et par adresse IP.
const STRICT_LIMIT = { rateLimit: { max: 10, timeWindow: '15 minutes' } };

export function authRoutes(api: FastifyInstance, { db, config, sessions }: Deps): void {
  const cookieOptions = {
    path: config.basePath,
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL_MS / 1000,
  };

  api.post<{ Body: { code: string; email: string; password: string; familyName?: string } }>(
    '/auth/register',
    {
      config: STRICT_LIMIT,
      schema: {
        body: {
          type: 'object',
          required: ['code', 'email', 'password'],
          additionalProperties: false,
          properties: {
            code: { type: 'string', minLength: 6, maxLength: 40 },
            email: EMAIL,
            password: PASSWORD,
            familyName: { type: 'string', minLength: 1, maxLength: 60 },
          },
        },
      },
    },
    async (req, reply) => {
      const email = req.body.email.trim().toLowerCase();
      const passwordHash = await hashPassword(req.body.password);
      const user = db.transaction((tx) => {
        const invitation = findUsableInvitation(db, req.body.code);
        if (!invitation)
          throw badRequest('invalid_invitation', 'Ce code d’invitation n’est pas valable.');
        if (
          tx
            .select({ id: parentUsers.id })
            .from(parentUsers)
            .where(eq(parentUsers.email, email))
            .get()
        ) {
          throw conflict('email_taken', 'Un compte existe déjà avec cette adresse.');
        }
        const now = new Date();
        const familyId =
          invitation.familyId ??
          tx
            .insert(families)
            .values({ name: req.body.familyName?.trim() || 'Ma famille', createdAt: now })
            .returning({ id: families.id })
            .get().id;
        const created = tx
          .insert(parentUsers)
          .values({ familyId, email, passwordHash, role: invitation.role, createdAt: now })
          .returning()
          .get();
        tx.update(invitations)
          .set({ usedAt: now, usedBy: created.id })
          .where(eq(invitations.id, invitation.id))
          .run();
        return created;
      });
      const token = sessions.create(user.familyId, user.id, req.headers['user-agent']);
      reply.setCookie(SESSION_COOKIE, token, cookieOptions);
      return buildMe(db, sessions.load(token)!, config.version);
    },
  );

  api.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      config: STRICT_LIMIT,
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', maxLength: 200 },
            password: { type: 'string', maxLength: 200 },
          },
        },
      },
    },
    async (req, reply) => {
      const email = req.body.email.trim().toLowerCase();
      const user = db.select().from(parentUsers).where(eq(parentUsers.email, email)).get();
      const ok = await verifyPassword(user?.passwordHash ?? null, req.body.password);
      if (!user || !ok)
        throw new HttpError(401, 'bad_credentials', 'E-mail ou mot de passe incorrect.');
      const token = sessions.create(user.familyId, user.id, req.headers['user-agent']);
      reply.setCookie(SESSION_COOKIE, token, cookieOptions);
      return buildMe(db, sessions.load(token)!, config.version);
    },
  );

  api.post('/auth/logout', async (req, reply) => {
    if (req.auth) sessions.destroy(req.auth.sessionId);
    reply.clearCookie(SESSION_COOKIE, { path: config.basePath });
    return { ok: true };
  });

  api.get('/auth/me', async (req) => buildMe(db, requireAuth(req), config.version));

  /** Déverrouille l'espace parent pour 10 minutes. */
  api.post<{ Body: { password: string } }>(
    '/auth/unlock',
    {
      config: STRICT_LIMIT,
      schema: {
        body: {
          type: 'object',
          required: ['password'],
          additionalProperties: false,
          properties: { password: { type: 'string', maxLength: 200 } },
        },
      },
    },
    async (req) => {
      const auth = requireAuth(req);
      const user = db.select().from(parentUsers).where(eq(parentUsers.id, auth.user.id)).get();
      if (!(await verifyPassword(user?.passwordHash ?? null, req.body.password))) {
        throw new HttpError(401, 'bad_credentials', 'Mot de passe incorrect.');
      }
      sessions.update(auth.sessionId, { parentVerifiedAt: new Date() });
      return buildMe(db, sessions.load(req.cookies[SESSION_COOKIE]!)!, config.version);
    },
  );

  api.post('/auth/lock', async (req) => {
    const auth = requireAuth(req);
    sessions.update(auth.sessionId, { parentVerifiedAt: null });
    return { ok: true };
  });

  /** Choix du profil enfant sur cet appareil ; l'espace parent se verrouille. */
  api.post<{ Body: { childId: number | null } }>(
    '/auth/active-child',
    {
      schema: {
        body: {
          type: 'object',
          required: ['childId'],
          additionalProperties: false,
          properties: { childId: { type: ['integer', 'null'] } },
        },
      },
    },
    async (req) => {
      const auth = requireAuth(req);
      const childId = req.body.childId;
      if (childId !== null) getFamilyChild(db, auth.familyId, childId);
      sessions.update(auth.sessionId, {
        activeChildId: childId,
        ...(childId !== null ? { parentVerifiedAt: null } : {}),
      });
      return buildMe(db, sessions.load(req.cookies[SESSION_COOKIE]!)!, config.version);
    },
  );
}
