import type { InvitationPreview, RedeemRequest } from '@app/core';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../auth/crypto';
import { createGuard, ipOf } from '../auth/limits';
import { requireAuth, requireParent, SESSION_COOKIE, SESSION_TTL_MS } from '../auth/session';
import { parentUsers } from '../db/schema';
import { badRequest, conflict, HttpError } from '../errors';
import { buildMe, getFamilyChild } from '../services/family';
import {
  attachPupil,
  ensureFamily,
  invitedPupil,
  joinSchool,
  markUsed,
  newFamily,
  previewInvitation,
  usableInvitation,
} from '../services/redeem';
import type { Deps } from './deps';

const EMAIL = {
  type: 'string',
  maxLength: 200,
  pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
} as const;
const PASSWORD = { type: 'string', minLength: 8, maxLength: 200 } as const;
export function authRoutes(api: FastifyInstance, { db, config, sessions }: Deps): void {
  // Connexion, inscription, codes, déverrouillage : un plafond par adresse IP, assez haut pour
  // toute une école derrière la même adresse, partagé par ces routes ; et pour les mots de passe,
  // 10 essais par quart d'heure et par compte.
  const perIp = createGuard(api, {
    max: config.authAttemptsPerIp,
    keyOf: (req) => `auth-ip:${ipOf(req)}`,
  });
  const loginPerAccount = createGuard(api, {
    max: config.authAttempts,
    // Avec l'adresse : un inconnu ne bloque pas le compte d'un parent depuis ailleurs.
    keyOf: (req) =>
      `login:${ipOf(req)}:${String((req.body as { email?: unknown }).email ?? '')
        .trim()
        .toLowerCase()}`,
  });
  const unlockPerAccount = createGuard(api, {
    max: config.authAttempts,
    keyOf: (req) => `unlock:${req.auth?.user.id ?? ipOf(req)}`,
  });
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
      preHandler: perIp,
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
        const invitation = usableInvitation(tx, req.body.code);
        if (
          tx
            .select({ id: parentUsers.id })
            .from(parentUsers)
            .where(eq(parentUsers.email, email))
            .get()
        ) {
          throw conflict('email_taken', 'Un compte existe déjà avec cette adresse.');
        }
        const kind = invitation.role;
        // Un enseignant n'a pas de famille ; une fiche parent crée la famille de l'élève.
        let familyId: number | null = null;
        if (kind === 'admin' || kind === 'parent')
          familyId = invitation.familyId ?? newFamily(tx, req.body.familyName);
        else if (kind === 'eleve') {
          invitedPupil(tx, invitation);
          familyId = newFamily(tx, req.body.familyName);
        }
        const created = tx
          .insert(parentUsers)
          .values({
            familyId,
            email,
            passwordHash,
            role: kind === 'admin' ? 'admin' : 'parent',
            createdAt: new Date(),
          })
          .returning()
          .get();
        if (kind === 'direction' || kind === 'enseignant') joinSchool(tx, invitation, created.id);
        markUsed(tx, invitation, created.id);
        if (kind === 'eleve') attachPupil(tx, invitation, familyId!);
        return created;
      });
      const token = sessions.create(user.familyId, user.id, req.headers['user-agent']);
      reply.setCookie(SESSION_COOKIE, token, cookieOptions);
      return buildMe(db, sessions.load(token)!, config.version);
    },
  );

  /** Ce qu'ouvre un code (sans l'utiliser) : pour l'écran d'activation d'une fiche parent. */
  api.post<{ Body: { code: string } }>(
    '/auth/invitation',
    {
      preHandler: perIp,
      schema: {
        body: {
          type: 'object',
          required: ['code'],
          additionalProperties: false,
          properties: { code: { type: 'string', minLength: 6, maxLength: 40 } },
        },
      },
    },
    async (req): Promise<InvitationPreview> => previewInvitation(db, req.body.code),
  );

  /**
   * Un compte déjà connecté utilise un code : rejoindre une école, ajouter l'élève d'une fiche
   * parent à sa famille (ou le fusionner avec un profil existant), rejoindre une famille.
   */
  api.post<{ Body: RedeemRequest }>(
    '/auth/redeem',
    {
      preHandler: perIp,
      schema: {
        body: {
          type: 'object',
          required: ['code'],
          additionalProperties: false,
          properties: {
            code: { type: 'string', minLength: 6, maxLength: 40 },
            mergeInto: { type: 'integer' },
          },
        },
      },
    },
    async (req) => {
      const auth = requireParent(req);
      db.transaction((tx) => {
        const invitation = usableInvitation(tx, req.body.code);
        const user = { id: auth.user.id, familyId: auth.familyId };
        switch (invitation.role) {
          case 'direction':
          case 'enseignant':
            joinSchool(tx, invitation, user.id);
            break;
          case 'eleve':
            attachPupil(tx, invitation, ensureFamily(tx, user), req.body.mergeInto);
            break;
          case 'parent':
            if (user.familyId !== null)
              throw conflict('already_family', 'Ce compte a déjà une famille.');
            tx.update(parentUsers)
              .set({ familyId: invitation.familyId ?? newFamily(tx, undefined) })
              .where(eq(parentUsers.id, user.id))
              .run();
            break;
          default:
            throw badRequest('invalid_invitation', 'Ce code d’invitation n’est pas valable.');
        }
        markUsed(tx, invitation, user.id);
      });
      return buildMe(db, sessions.load(req.cookies[SESSION_COOKIE]!)!, config.version);
    },
  );

  api.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    {
      preHandler: [perIp, loginPerAccount],
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
      preHandler: [perIp, unlockPerAccount],
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
