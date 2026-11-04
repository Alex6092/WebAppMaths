import type { SchoolRole } from '@app/core';
import { and, eq } from 'drizzle-orm';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import { children, classrooms, classroomTeachers, schoolMembers } from '../db/schema';
import { forbidden, notFound } from '../errors';

/**
 * Cloisonnement côté école : toute requête sur une école, une classe ou un élève passe par ici,
 * comme getFamilyChild pour la famille. Hors de son périmètre, on répond « introuvable ».
 */

export type ClassRow = typeof classrooms.$inferSelect;
export type ChildRow = typeof children.$inferSelect;

/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select'>;

export function schoolRole(db: Tx, userId: number, schoolId: number): SchoolRole | null {
  return (
    db
      .select({ role: schoolMembers.role })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.userId, userId)))
      .get()?.role ?? null
  );
}

/** Le rôle du compte dans l'école ; « direction » exigée si only = 'direction'. */
export function requireSchoolRole(
  db: Tx,
  auth: AuthContext,
  schoolId: number,
  only?: 'direction',
): SchoolRole {
  const role = schoolRole(db, auth.user.id, schoolId);
  if (!role) throw notFound('school_not_found', 'École introuvable.');
  if (only === 'direction' && role !== 'direction')
    throw forbidden('direction_only', 'Réservé à la direction de l’école.');
  return role;
}

export function isClassTeacher(db: Tx, userId: number, classId: number): boolean {
  return !!db
    .select({ userId: classroomTeachers.userId })
    .from(classroomTeachers)
    .where(and(eq(classroomTeachers.classId, classId), eq(classroomTeachers.userId, userId)))
    .get();
}

/** Une classe que le compte gère : il en est l'enseignant, ou il dirige l'école. */
export function getManagedClass(db: Tx, auth: AuthContext, classId: number): ClassRow {
  const row = db.select().from(classrooms).where(eq(classrooms.id, classId)).get();
  const role = row ? schoolRole(db, auth.user.id, row.schoolId) : null;
  if (!row || !role || (role !== 'direction' && !isClassTeacher(db, auth.user.id, row.id)))
    throw notFound('class_not_found', 'Classe introuvable.');
  return row;
}

/** Un élève d'une classe que le compte gère. */
export function getPupil(
  db: Tx,
  auth: AuthContext,
  pupilId: number,
): { pupil: ChildRow; classroom: ClassRow } {
  const pupil = db.select().from(children).where(eq(children.id, pupilId)).get();
  if (!pupil || pupil.classId === null) throw notFound('pupil_not_found', 'Élève introuvable.');
  try {
    return { pupil, classroom: getManagedClass(db, auth, pupil.classId) };
  } catch {
    throw notFound('pupil_not_found', 'Élève introuvable.');
  }
}

/** Les élèves d'une classe, par ordre alphabétique. */
export function classPupils(db: Tx, classId: number): ChildRow[] {
  return db
    .select()
    .from(children)
    .where(eq(children.classId, classId))
    .all()
    .sort(
      (a, b) =>
        a.firstName.localeCompare(b.firstName, 'fr') ||
        (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr'),
    );
}
