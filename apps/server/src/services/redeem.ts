import type { InvitationPreview } from '@app/core';
import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  children,
  classrooms,
  families,
  invitations,
  parentUsers,
  schoolMembers,
  schools,
} from '../db/schema';
import { badRequest, conflict } from '../errors';
import { getFamilyChild } from './family';
import { findUsableInvitation } from './invitations';
import { mergePupilInto } from './merge';

/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;
type InvitationRow = typeof invitations.$inferSelect;

export function usableInvitation(tx: Pick<Db, 'select'>, code: string): InvitationRow {
  const invitation = findUsableInvitation(tx, code);
  if (!invitation)
    throw badRequest('invalid_invitation', 'Ce code d’invitation n’est pas valable.');
  return invitation;
}

/** Ce que montre un code avant de l'utiliser : l'école, l'élève de la fiche parent. */
export function previewInvitation(db: Db, code: string): InvitationPreview {
  const invitation = usableInvitation(db, code);
  const school =
    invitation.schoolId !== null
      ? db.select().from(schools).where(eq(schools.id, invitation.schoolId)).get()
      : undefined;
  const pupil =
    invitation.childId !== null
      ? db
          .select({ firstName: children.firstName, className: classrooms.name })
          .from(children)
          .leftJoin(classrooms, eq(classrooms.id, children.classId))
          .where(eq(children.id, invitation.childId))
          .get()
      : undefined;
  return {
    kind: invitation.role,
    schoolName: school?.name ?? null,
    pupil: pupil ? { firstName: pupil.firstName, className: pupil.className } : null,
  };
}

export function newFamily(tx: Tx, name: string | undefined): number {
  return tx
    .insert(families)
    .values({ name: name?.trim() || 'Ma famille', createdAt: new Date() })
    .returning({ id: families.id })
    .get().id;
}

export function markUsed(tx: Tx, invitation: InvitationRow, userId: number): void {
  tx.update(invitations)
    .set({ usedAt: new Date(), usedBy: userId })
    .where(eq(invitations.id, invitation.id))
    .run();
}

/** Invitation direction / enseignant : le compte rejoint l'école. */
export function joinSchool(tx: Tx, invitation: InvitationRow, userId: number): void {
  const role = invitation.role;
  if (invitation.schoolId === null || (role !== 'direction' && role !== 'enseignant'))
    throw badRequest('invalid_invitation', 'Ce code d’invitation n’est pas valable.');
  const existing = tx
    .select()
    .from(schoolMembers)
    .where(and(eq(schoolMembers.schoolId, invitation.schoolId), eq(schoolMembers.userId, userId)))
    .get();
  if (existing) throw conflict('already_member', 'Ce compte fait déjà partie de cette école.');
  tx.insert(schoolMembers)
    .values({ schoolId: invitation.schoolId, userId, role, createdAt: new Date() })
    .run();
}

/** L'élève d'une fiche parent, s'il n'a pas encore de famille. */
export function invitedPupil(tx: Pick<Db, 'select'>, invitation: InvitationRow) {
  const pupil =
    invitation.childId !== null
      ? tx.select().from(children).where(eq(children.id, invitation.childId)).get()
      : undefined;
  if (!pupil) throw badRequest('invalid_invitation', 'Ce code d’invitation n’est pas valable.');
  if (pupil.familyId !== null)
    throw conflict('already_linked', 'Cet élève est déjà rattaché à une famille.');
  return pupil;
}

/**
 * Fiche parent : l'élève rejoint la famille, comme nouveau profil, ou fusionné avec le profil
 * que la famille avait déjà pour cet enfant (mergeInto).
 */
export function attachPupil(
  tx: Tx,
  invitation: InvitationRow,
  familyId: number,
  mergeInto?: number,
): number {
  const pupil = invitedPupil(tx, invitation);
  if (mergeInto === undefined) {
    tx.update(children).set({ familyId }).where(eq(children.id, pupil.id)).run();
    return pupil.id;
  }
  const target = getFamilyChild(tx, familyId, mergeInto);
  if (target.classId !== null)
    throw conflict('already_enrolled', `${target.firstName} est déjà inscrit dans une classe.`);
  mergePupilInto(tx, pupil, target);
  return target.id;
}

/** Donne une famille au compte qui n'en a pas (un enseignant qui active la fiche de son enfant). */
export function ensureFamily(tx: Tx, user: { id: number; familyId: number | null }): number {
  if (user.familyId !== null) return user.familyId;
  const familyId = newFamily(tx, undefined);
  tx.update(parentUsers).set({ familyId }).where(eq(parentUsers.id, user.id)).run();
  return familyId;
}
