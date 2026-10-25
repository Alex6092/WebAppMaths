import type { Role } from '@app/core';
import { and, eq, gt } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import type { Db } from '../db/client';
import { authSessions, parentUsers } from '../db/schema';
import { forbidden, unauthorized } from '../errors';
import { newSessionToken, sha256 } from './crypto';

export const SESSION_COOKIE = 'wam_sid';
/** Un appareil de confiance reste connecté un an. */
export const SESSION_TTL_MS = 365 * 24 * 3600 * 1000;
/** Après saisie du mot de passe, l'espace parent reste ouvert 10 minutes. */
export const PARENT_UNLOCK_MS = 10 * 60 * 1000;
const TOUCH_EVERY_MS = 24 * 3600 * 1000;

export interface AuthContext {
  sessionId: string;
  familyId: number;
  user: { id: number; email: string; role: Role };
  parentVerifiedAt: number | null;
  activeChildId: number | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

export class SessionStore {
  constructor(private readonly db: Db) {}

  /** Crée une session (espace parent déverrouillé) et renvoie le jeton du cookie. */
  create(familyId: number, userId: number, userAgent: string | undefined): string {
    const token = newSessionToken();
    const now = Date.now();
    this.db
      .insert(authSessions)
      .values({
        id: sha256(token),
        familyId,
        parentUserId: userId,
        parentVerifiedAt: new Date(now),
        userAgent: userAgent?.slice(0, 200) ?? null,
        createdAt: new Date(now),
        lastSeenAt: new Date(now),
        expiresAt: new Date(now + SESSION_TTL_MS),
      })
      .run();
    return token;
  }

  load(token: string): AuthContext | null {
    const now = Date.now();
    const row = this.db
      .select({ session: authSessions, user: parentUsers })
      .from(authSessions)
      .innerJoin(parentUsers, eq(parentUsers.id, authSessions.parentUserId))
      .where(and(eq(authSessions.id, sha256(token)), gt(authSessions.expiresAt, new Date(now))))
      .get();
    if (!row) return null;
    // Expiration glissante, prolongée au plus une fois par jour (pas d'écriture à chaque requête).
    if (now - row.session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
      this.db
        .update(authSessions)
        .set({ lastSeenAt: new Date(now), expiresAt: new Date(now + SESSION_TTL_MS) })
        .where(eq(authSessions.id, row.session.id))
        .run();
    }
    return {
      sessionId: row.session.id,
      familyId: row.session.familyId,
      user: { id: row.user.id, email: row.user.email, role: row.user.role },
      parentVerifiedAt: row.session.parentVerifiedAt?.getTime() ?? null,
      activeChildId: row.session.activeChildId,
    };
  }

  update(
    sessionId: string,
    patch: { parentVerifiedAt?: Date | null; activeChildId?: number | null },
  ): void {
    this.db.update(authSessions).set(patch).where(eq(authSessions.id, sessionId)).run();
  }

  destroy(sessionId: string): void {
    this.db.delete(authSessions).where(eq(authSessions.id, sessionId)).run();
  }
}

export function isParentUnlocked(auth: AuthContext, now = Date.now()): boolean {
  return auth.parentVerifiedAt !== null && now - auth.parentVerifiedAt < PARENT_UNLOCK_MS;
}

export function requireAuth(req: FastifyRequest): AuthContext {
  if (!req.auth) throw unauthorized();
  return req.auth;
}

export function requireParent(req: FastifyRequest): AuthContext {
  const auth = requireAuth(req);
  if (!isParentUnlocked(auth)) {
    throw forbidden('parent_locked', 'Saisis le mot de passe parent pour continuer.');
  }
  return auth;
}

export function requireAdmin(req: FastifyRequest): AuthContext {
  const auth = requireParent(req);
  if (auth.user.role !== 'admin') throw forbidden('admin_only', 'Réservé à l’administrateur.');
  return auth;
}
