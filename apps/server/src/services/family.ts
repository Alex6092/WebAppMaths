import { isGrade, type ChildDto, type MeResponse, type MeSchool } from '@app/core';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { isParentUnlocked, PARENT_UNLOCK_MS, type AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import {
  children,
  classrooms,
  classroomTeachers,
  families,
  schoolMembers,
  schools,
} from '../db/schema';
import { notFound } from '../errors';

type ChildRow = typeof children.$inferSelect;
/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select'>;

/** La classe et l'école d'un enfant inscrit. */
function classroomOf(db: Tx, classId: number | null): ChildDto['classroom'] {
  if (classId === null) return null;
  const row = db
    .select({ id: classrooms.id, name: classrooms.name, schoolName: schools.name })
    .from(classrooms)
    .innerJoin(schools, eq(schools.id, classrooms.schoolId))
    .where(eq(classrooms.id, classId))
    .get();
  return row ?? null;
}

export function toChildDto(db: Tx, row: ChildRow): ChildDto {
  return {
    id: row.id,
    firstName: row.firstName,
    avatar: row.avatar,
    grade: isGrade(row.grade) ? row.grade : 'CP',
    themeId: row.themeId,
    coins: row.coins,
    sound: row.settings.sound !== false,
    classroom: classroomOf(db, row.classId),
  };
}

/** Enfant de la famille connectée ; toute requête sur un enfant passe par ici (cloisonnement). */
export function getFamilyChild(db: Tx, familyId: number | null, childId: number): ChildRow {
  const child =
    familyId === null
      ? undefined
      : db
          .select()
          .from(children)
          .where(and(eq(children.id, childId), eq(children.familyId, familyId)))
          .get();
  if (!child) throw notFound('child_not_found', 'Profil introuvable.');
  return child;
}

/** Les écoles du compte, et les classes qu'il y gère (toutes pour la direction). */
export function meSchools(db: Tx, userId: number): MeSchool[] {
  const memberships = db
    .select({ id: schools.id, name: schools.name, role: schoolMembers.role })
    .from(schoolMembers)
    .innerJoin(schools, eq(schools.id, schoolMembers.schoolId))
    .where(eq(schoolMembers.userId, userId))
    .orderBy(asc(schools.name))
    .all();
  if (memberships.length === 0) return [];
  const taught = new Set(
    db
      .select({ classId: classroomTeachers.classId })
      .from(classroomTeachers)
      .where(eq(classroomTeachers.userId, userId))
      .all()
      .map((r) => r.classId),
  );
  const classes = db
    .select({ id: classrooms.id, name: classrooms.name, schoolId: classrooms.schoolId })
    .from(classrooms)
    .where(
      inArray(
        classrooms.schoolId,
        memberships.map((m) => m.id),
      ),
    )
    .orderBy(asc(classrooms.name))
    .all();
  return memberships.map((m) => ({
    ...m,
    classes: classes
      .filter((c) => c.schoolId === m.id && (m.role === 'direction' || taught.has(c.id)))
      .map(({ id, name }) => ({ id, name })),
  }));
}

export function buildMe(db: Db, auth: AuthContext, version: string): MeResponse {
  const family =
    auth.familyId === null
      ? null
      : db.select().from(families).where(eq(families.id, auth.familyId)).get();
  if (auth.familyId !== null && !family) throw notFound('family_not_found', 'Famille introuvable.');
  const kids =
    auth.familyId === null
      ? []
      : db
          .select()
          .from(children)
          .where(eq(children.familyId, auth.familyId))
          .orderBy(asc(children.createdAt))
          .all();
  return {
    user: auth.user,
    family: family ? { id: family.id, name: family.name } : null,
    parentVerifiedUntil:
      auth.familyId !== null && isParentUnlocked(auth)
        ? auth.parentVerifiedAt! + PARENT_UNLOCK_MS
        : null,
    activeChildId: auth.activeChildId,
    children: kids.map((k) => toChildDto(db, k)),
    schools: meSchools(db, auth.user.id),
    version,
  };
}
