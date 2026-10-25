import type { CreatedInvitation, InvitationDto, Role } from '@app/core';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { newInvitationCode, normalizeInvitationCode, sha256 } from '../auth/crypto';
import type { Db } from '../db/client';
import { families, invitations, parentUsers } from '../db/schema';

const DAY_MS = 24 * 3600 * 1000;

export function createInvitation(
  db: Db,
  options: {
    role: Role;
    familyId: number | null;
    createdBy: number | null;
    note?: string | null;
    expiresInDays?: number;
    code?: string;
  },
): CreatedInvitation {
  const code = options.code ?? newInvitationCode();
  const now = Date.now();
  const expiresAt = now + (options.expiresInDays ?? 7) * DAY_MS;
  db.insert(invitations)
    .values({
      codeHash: sha256(normalizeInvitationCode(code)),
      role: options.role,
      familyId: options.familyId,
      createdBy: options.createdBy,
      note: options.note ?? null,
      createdAt: new Date(now),
      expiresAt: new Date(expiresAt),
    })
    .run();
  return { code, expiresAt };
}

export function findUsableInvitation(db: Db, code: string) {
  const invitation = db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.codeHash, sha256(normalizeInvitationCode(code))),
        isNull(invitations.usedAt),
      ),
    )
    .get();
  return invitation && invitation.expiresAt.getTime() > Date.now() ? invitation : undefined;
}

/**
 * Tant qu'aucun administrateur n'existe, crée une invitation administrateur et renvoie son code
 * (affiché dans les journaux au démarrage). Les anciennes invitations de démarrage sont retirées.
 */
export function ensureAdminInvitation(db: Db, fixedCode: string | null): string | null {
  const admin = db
    .select({ id: parentUsers.id })
    .from(parentUsers)
    .where(eq(parentUsers.role, 'admin'))
    .get();
  if (admin) return null;
  db.delete(invitations)
    .where(
      and(isNull(invitations.createdBy), eq(invitations.role, 'admin'), isNull(invitations.usedAt)),
    )
    .run();
  return createInvitation(db, {
    role: 'admin',
    familyId: null,
    createdBy: null,
    note: 'Invitation de démarrage',
    code: fixedCode ?? undefined,
  }).code;
}

export function listInvitations(db: Db): InvitationDto[] {
  const usedBy = alias(parentUsers, 'used_by_user');
  return db
    .select({ invitation: invitations, familyName: families.name, usedByEmail: usedBy.email })
    .from(invitations)
    .leftJoin(families, eq(families.id, invitations.familyId))
    .leftJoin(usedBy, eq(usedBy.id, invitations.usedBy))
    .orderBy(desc(invitations.createdAt))
    .all()
    .map(({ invitation, familyName, usedByEmail }) => ({
      id: invitation.id,
      role: invitation.role,
      note: invitation.note,
      familyName,
      createdAt: invitation.createdAt.getTime(),
      expiresAt: invitation.expiresAt.getTime(),
      usedAt: invitation.usedAt?.getTime() ?? null,
      usedByEmail,
    }));
}
