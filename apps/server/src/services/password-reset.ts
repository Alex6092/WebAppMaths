import type { CreatedInvitation, ResetPreview } from '@app/core';
import { and, eq, isNull, or } from 'drizzle-orm';
import { hashPassword, newInvitationCode, normalizeInvitationCode, sha256 } from '../auth/crypto';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import {
  authSessions,
  children,
  parentUsers,
  passwordResets,
  schoolMembers,
  schools,
} from '../db/schema';
import { badRequest, conflict, forbidden, notFound } from '../errors';
import { getPupil, requireSchoolRole } from './access';

/**
 * Mot de passe oublié, sans e-mail : une fiche (code + QR) imprimée par la direction pour la
 * famille d'un élève, ou un code donné par l'administrateur pour un compte. Le parent y saisit
 * son e-mail et un nouveau mot de passe ; toutes ses sessions sont alors fermées.
 */

const DAY_MS = 24 * 3600 * 1000;
/** Une fiche glissée dans le cartable a deux semaines pour servir. */
export const RESET_DAYS = 14;

type ResetRow = typeof passwordResets.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

function createReset(
  tx: Tx,
  target: { userId?: number; familyId?: number; childId?: number; schoolId?: number },
  createdBy: number | null,
): CreatedInvitation {
  const code = newInvitationCode();
  const now = Date.now();
  const expiresAt = now + RESET_DAYS * DAY_MS;
  // Une nouvelle fiche remplace la précédente : une fiche perdue ne marche plus.
  tx.delete(passwordResets)
    .where(
      and(
        isNull(passwordResets.usedAt),
        target.userId !== undefined
          ? eq(passwordResets.userId, target.userId)
          : eq(passwordResets.familyId, target.familyId!),
      ),
    )
    .run();
  tx.insert(passwordResets)
    .values({
      codeHash: sha256(normalizeInvitationCode(code)),
      userId: target.userId ?? null,
      familyId: target.familyId ?? null,
      childId: target.childId ?? null,
      schoolId: target.schoolId ?? null,
      createdBy,
      createdAt: new Date(now),
      expiresAt: new Date(expiresAt),
    })
    .run();
  return { code, expiresAt };
}

/** La direction : une fiche pour les parents d'un élève rattaché à une famille. */
export function createFamilyReset(db: Db, auth: AuthContext, pupilId: number): CreatedInvitation {
  const { pupil, classroom } = getPupil(db, auth, pupilId);
  requireSchoolRole(db, auth, classroom.schoolId, 'direction');
  if (pupil.familyId === null)
    throw conflict('not_linked', 'Aucun parent n’a encore activé la fiche de cet élève.');
  return createReset(
    db,
    { familyId: pupil.familyId, childId: pupil.id, schoolId: classroom.schoolId },
    auth.user.id,
  );
}

/** L'administrateur (ou la ligne de commande) : un code pour un compte, désigné par son e-mail. */
export function createAccountReset(
  db: Tx,
  email: string,
  createdBy: number | null,
): CreatedInvitation {
  const user = db
    .select({ id: parentUsers.id })
    .from(parentUsers)
    .where(eq(parentUsers.email, email.trim().toLowerCase()))
    .get();
  if (!user) throw notFound('account_not_found', 'Aucun compte avec cette adresse.');
  return createReset(db, { userId: user.id }, createdBy);
}

const isSchoolMember = (db: Pick<Db, 'select'>, userId: number) =>
  !!db
    .select({ userId: schoolMembers.userId })
    .from(schoolMembers)
    .where(eq(schoolMembers.userId, userId))
    .get();

function usableReset(db: Pick<Db, 'select'>, code: string): ResetRow {
  const row = db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.codeHash, sha256(normalizeInvitationCode(code))),
        isNull(passwordResets.usedAt),
      ),
    )
    .get();
  if (!row || row.expiresAt.getTime() <= Date.now())
    throw badRequest('invalid_reset', 'Ce code n’est pas valable (déjà utilisé ou expiré).');
  return row;
}

export function previewReset(db: Db, code: string): ResetPreview {
  const row = usableReset(db, code);
  const school =
    row.schoolId !== null
      ? db.select({ name: schools.name }).from(schools).where(eq(schools.id, row.schoolId)).get()
      : undefined;
  const pupil =
    row.childId !== null
      ? db
          .select({ firstName: children.firstName })
          .from(children)
          .where(eq(children.id, row.childId))
          .get()
      : undefined;
  return { schoolName: school?.name ?? null, pupil: pupil ?? null };
}

/**
 * Change le mot de passe du compte (de la famille de la fiche, ou visé par le code) : ferme toutes
 * ses sessions et invalide les autres codes en attente pour ce compte ou sa famille. Renvoie le
 * compte, à connecter sur cet appareil.
 */
export async function resetPassword(db: Db, code: string, email: string, password: string) {
  const row = usableReset(db, code);
  const user = db
    .select()
    .from(parentUsers)
    .where(eq(parentUsers.email, email.trim().toLowerCase()))
    .get();
  const matches =
    !!user &&
    (row.userId !== null
      ? user.id === row.userId
      : user.familyId === row.familyId && row.familyId !== null);
  if (!matches)
    throw badRequest('reset_email_mismatch', 'Ce code ne correspond pas à cette adresse.');
  // La fiche d'une école ne donne pas la main sur un compte de l'administrateur ou d'un
  // enseignant (celui d'une autre école, peut-être) : seul l'administrateur le réinitialise.
  if (row.userId === null && (user!.role === 'admin' || isSchoolMember(db, user!.id)))
    throw forbidden(
      'reset_needs_admin',
      'Ce compte est aussi celui d’un enseignant : demande un code à l’administrateur de l’app.',
    );
  const passwordHash = await hashPassword(password);
  const now = new Date();
  db.transaction((tx) => {
    // Le code a pu servir pendant le calcul de l'empreinte : on revérifie.
    usableReset(tx, code);
    tx.update(parentUsers).set({ passwordHash }).where(eq(parentUsers.id, user!.id)).run();
    tx.delete(authSessions).where(eq(authSessions.parentUserId, user!.id)).run();
    tx.update(passwordResets)
      .set({ usedAt: now })
      .where(
        and(
          isNull(passwordResets.usedAt),
          or(
            eq(passwordResets.id, row.id),
            eq(passwordResets.userId, user!.id),
            user!.familyId !== null ? eq(passwordResets.familyId, user!.familyId) : undefined,
          ),
        ),
      )
      .run();
  });
  return user!;
}
