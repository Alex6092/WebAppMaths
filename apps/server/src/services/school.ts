import {
  AVATARS,
  schoolYearEnd,
  schoolYearOf,
  type AdminSchoolDto,
  type ClassroomDetail,
  type ClassroomDto,
  type GradeId,
  type NewPupil,
  type PupilCode,
  type PupilDto,
  type SchoolDto,
  type SchoolRole,
} from '@app/core';
import { DEFAULT_THEME_ID } from '@app/themes';
import { and, asc, count, desc, eq, gt, inArray, isNotNull, isNull } from 'drizzle-orm';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import {
  assignments,
  authSessions,
  children,
  classrooms,
  classroomTeachers,
  invitations,
  parentUsers,
  rolloverChoices,
  schoolMembers,
  schools,
} from '../db/schema';
import { badRequest, conflict, notFound } from '../errors';
import {
  classPupils,
  getManagedClass,
  requireSchoolRole,
  type ChildRow,
  type ClassRow,
} from './access';
import { createInvitation, listInvitations } from './invitations';
import { classActiveNotions } from './notions';

/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

// --- Écoles ---------------------------------------------------------------------------------

export function createSchool(db: Tx, input: { name: string; city?: string | null }) {
  return db
    .insert(schools)
    .values({ name: input.name.trim(), city: input.city?.trim() || null, createdAt: new Date() })
    .returning()
    .get();
}

export function adminSchools(db: Db): AdminSchoolDto[] {
  const rows = db.select().from(schools).orderBy(asc(schools.name)).all();
  const countBy = (table: typeof schoolMembers | typeof classrooms) =>
    new Map(
      db
        .select({ schoolId: table.schoolId, n: count() })
        .from(table)
        .groupBy(table.schoolId)
        .all()
        .map((r) => [r.schoolId, r.n]),
    );
  const members = countBy(schoolMembers);
  const classes = countBy(classrooms);
  const pupils = new Map(
    db
      .select({ schoolId: classrooms.schoolId, n: count() })
      .from(children)
      .innerJoin(classrooms, eq(classrooms.id, children.classId))
      .groupBy(classrooms.schoolId)
      .all()
      .map((r) => [r.schoolId, r.n]),
  );
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    members: members.get(s.id) ?? 0,
    classes: classes.get(s.id) ?? 0,
    pupils: pupils.get(s.id) ?? 0,
    createdAt: s.createdAt.getTime(),
  }));
}

export function getSchool(db: Pick<Db, 'select'>, schoolId: number) {
  const row = db.select().from(schools).where(eq(schools.id, schoolId)).get();
  if (!row) throw notFound('school_not_found', 'École introuvable.');
  return row;
}

/** Supprime une école : chaque classe d'abord (les élèves d'une famille restent à leur famille). */
export function deleteSchool(db: Db, schoolId: number): void {
  getSchool(db, schoolId);
  db.transaction((tx) => {
    for (const c of tx.select().from(classrooms).where(eq(classrooms.schoolId, schoolId)).all())
      removeClass(tx, c);
    tx.delete(schools).where(eq(schools.id, schoolId)).run();
  });
}

export function classroomDto(db: Pick<Db, 'select'>, row: ClassRow): ClassroomDto {
  return {
    id: row.id,
    name: row.name,
    grades: row.grades,
    schoolYear: row.schoolYear,
    teacherIds: db
      .select({ userId: classroomTeachers.userId })
      .from(classroomTeachers)
      .where(eq(classroomTeachers.classId, row.id))
      .all()
      .map((t) => t.userId),
    pupils:
      db.select({ n: count() }).from(children).where(eq(children.classId, row.id)).get()?.n ?? 0,
  };
}

export function schoolDto(db: Db, auth: AuthContext, schoolId: number): SchoolDto {
  const role = requireSchoolRole(db, auth, schoolId);
  const school = getSchool(db, schoolId);
  const classes = db
    .select()
    .from(classrooms)
    .where(eq(classrooms.schoolId, schoolId))
    .orderBy(asc(classrooms.name))
    .all()
    .map((c) => classroomDto(db, c));
  const members = db
    .select({ userId: schoolMembers.userId, email: parentUsers.email, role: schoolMembers.role })
    .from(schoolMembers)
    .innerJoin(parentUsers, eq(parentUsers.id, schoolMembers.userId))
    .where(eq(schoolMembers.schoolId, schoolId))
    .orderBy(asc(parentUsers.email))
    .all()
    .map((m) => ({
      ...m,
      classIds: classes.filter((c) => c.teacherIds.includes(m.userId)).map((c) => c.id),
    }));
  return {
    id: school.id,
    name: school.name,
    city: school.city,
    role,
    members,
    classes,
    invitations: role === 'direction' ? listInvitations(db, schoolId) : [],
  };
}

export function updateSchool(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  patch: { name?: string; city?: string | null },
): void {
  requireSchoolRole(db, auth, schoolId, 'direction');
  db.update(schools)
    .set({
      ...(patch.name ? { name: patch.name.trim() } : {}),
      ...(patch.city !== undefined ? { city: patch.city?.trim() || null } : {}),
    })
    .where(eq(schools.id, schoolId))
    .run();
}

/** Invite un enseignant (ou un autre membre de la direction) : 14 jours pour s'inscrire. */
export function inviteMember(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  role: SchoolRole,
  note: string | null,
) {
  requireSchoolRole(db, auth, schoolId, 'direction');
  return createInvitation(db, {
    role,
    familyId: null,
    schoolId,
    createdBy: auth.user.id,
    note,
    expiresInDays: 14,
  });
}

export function revokeSchoolInvitation(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  invitationId: number,
) {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const removed = db
    .delete(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.schoolId, schoolId),
        inArray(invitations.role, ['direction', 'enseignant']),
        isNull(invitations.usedAt),
      ),
    )
    .returning({ id: invitations.id })
    .get();
  if (!removed) throw notFound('invitation_not_found', 'Invitation introuvable ou déjà utilisée.');
}

/** Nombre de membres de la direction (il en reste toujours au moins un). */
function directionCount(db: Pick<Db, 'select'>, schoolId: number): number {
  return (
    db
      .select({ n: count() })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, 'direction')))
      .get()?.n ?? 0
  );
}

function getMember(db: Pick<Db, 'select'>, schoolId: number, userId: number) {
  const member = db
    .select()
    .from(schoolMembers)
    .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.userId, userId)))
    .get();
  if (!member) throw notFound('member_not_found', 'Enseignant introuvable.');
  return member;
}

export function setMemberRole(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  userId: number,
  role: SchoolRole,
): void {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const member = getMember(db, schoolId, userId);
  if (member.role === 'direction' && role !== 'direction' && directionCount(db, schoolId) <= 1)
    throw conflict('last_direction', 'L’école doit garder au moins un membre de la direction.');
  db.update(schoolMembers)
    .set({ role })
    .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.userId, userId)))
    .run();
}

/** Retire un enseignant de l'école (et de ses classes). Son compte, lui, reste. */
export function removeMember(db: Db, auth: AuthContext, schoolId: number, userId: number): void {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const member = getMember(db, schoolId, userId);
  if (member.role === 'direction' && directionCount(db, schoolId) <= 1)
    throw conflict('last_direction', 'L’école doit garder au moins un membre de la direction.');
  db.transaction((tx) => {
    const classIds = tx
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(eq(classrooms.schoolId, schoolId))
      .all()
      .map((c) => c.id);
    if (classIds.length > 0)
      tx.delete(classroomTeachers)
        .where(
          and(eq(classroomTeachers.userId, userId), inArray(classroomTeachers.classId, classIds)),
        )
        .run();
    tx.delete(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.userId, userId)))
      .run();
  });
}

// --- Classes --------------------------------------------------------------------------------

export interface ClassInput {
  name?: string;
  grades?: GradeId[];
  schoolYear?: string;
  teacherIds?: number[];
  focusNotions?: string[];
}

/** « 2026-2027 » : deux années qui se suivent. */
function checkSchoolYear(schoolYear: string | undefined): void {
  if (schoolYear === undefined) return;
  const [start, end] = schoolYear.split('-').map(Number);
  if (end !== start! + 1) throw badRequest('invalid_year', 'Année scolaire invalide.');
}

/** Les enseignants choisis doivent être membres de l'école. */
function checkTeachers(db: Pick<Db, 'select'>, schoolId: number, teacherIds: number[]): number[] {
  const ids = [...new Set(teacherIds)];
  if (ids.length === 0) return ids;
  const members = db
    .select({ userId: schoolMembers.userId })
    .from(schoolMembers)
    .where(and(eq(schoolMembers.schoolId, schoolId), inArray(schoolMembers.userId, ids)))
    .all();
  if (members.length !== ids.length)
    throw badRequest('invalid_teachers', 'Ces enseignants ne sont pas dans l’école.');
  return ids;
}

function setTeachers(tx: Tx, classId: number, teacherIds: number[]): void {
  tx.delete(classroomTeachers).where(eq(classroomTeachers.classId, classId)).run();
  for (const userId of teacherIds) tx.insert(classroomTeachers).values({ classId, userId }).run();
}

/** Crée une classe ; l'enseignant qui la crée en est l'enseignant. */
export function createClass(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  input: ClassInput & { name: string; grades: GradeId[] },
): ClassroomDto {
  const role = requireSchoolRole(db, auth, schoolId);
  checkSchoolYear(input.schoolYear);
  const teacherIds = checkTeachers(
    db,
    schoolId,
    input.teacherIds ?? (role === 'enseignant' ? [auth.user.id] : []),
  );
  if (role === 'enseignant' && !teacherIds.includes(auth.user.id)) teacherIds.push(auth.user.id);
  const row = db.transaction((tx) => {
    const created = tx
      .insert(classrooms)
      .values({
        schoolId,
        name: input.name.trim(),
        grades: [...new Set(input.grades)],
        schoolYear: input.schoolYear ?? schoolYearOf(new Date()),
        focusNotions: [],
        createdAt: new Date(),
      })
      .returning()
      .get();
    setTeachers(tx, created.id, teacherIds);
    return created;
  });
  return classroomDto(db, row);
}

export function updateClass(
  db: Db,
  auth: AuthContext,
  classId: number,
  input: ClassInput,
): ClassroomDetail {
  const row = getManagedClass(db, auth, classId);
  checkSchoolYear(input.schoolYear);
  const teacherIds =
    input.teacherIds !== undefined ? checkTeachers(db, row.schoolId, input.teacherIds) : null;
  db.transaction((tx) => {
    tx.update(classrooms)
      .set({
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.grades ? { grades: [...new Set(input.grades)] } : {}),
        ...(input.schoolYear ? { schoolYear: input.schoolYear } : {}),
        ...(input.focusNotions ? { focusNotions: [...new Set(input.focusNotions)] } : {}),
      })
      .where(eq(classrooms.id, row.id))
      .run();
    if (teacherIds) setTeachers(tx, row.id, teacherIds);
  });
  // L'enseignant qui se retire de la classe n'y a plus accès : on relit sans contrôle.
  return classroomDetailOf(
    db,
    db.select().from(classrooms).where(eq(classrooms.id, row.id)).get()!,
  );
}

export function deleteClass(db: Db, auth: AuthContext, classId: number): void {
  const row = getManagedClass(db, auth, classId);
  db.transaction((tx) => removeClass(tx, row));
}

/** Supprime une classe ; renvoie combien d'élèves sont restés à leur famille ou ont été supprimés. */
export function removeClass(tx: Tx, row: ClassRow): { detached: number; deleted: number } {
  const counts = { detached: 0, deleted: 0 };
  for (const pupil of classPupils(tx, row.id)) counts[removeFromClass(tx, pupil)]++;
  tx.delete(classrooms).where(eq(classrooms.id, row.id)).run();
  return counts;
}

export function classroomDetail(db: Db, auth: AuthContext, classId: number): ClassroomDetail {
  return classroomDetailOf(db, getManagedClass(db, auth, classId));
}

function classroomDetailOf(db: Db, row: ClassRow): ClassroomDetail {
  const school = getSchool(db, row.schoolId);
  return {
    ...classroomDto(db, row),
    schoolId: school.id,
    schoolName: school.name,
    focusNotions: row.focusNotions,
    activeNotions: classActiveNotions(db, row),
    pupilList: classPupils(db, row.id).map((p) => pupilDto(db, p)),
  };
}

// --- Élèves ---------------------------------------------------------------------------------

/** La dernière fiche parent pas encore utilisée d'un élève (ms), sinon null. */
function pendingCodeAt(db: Pick<Db, 'select'>, childId: number): number | null {
  const row = db
    .select({ createdAt: invitations.createdAt })
    .from(invitations)
    .where(
      and(
        eq(invitations.childId, childId),
        eq(invitations.role, 'eleve'),
        isNull(invitations.usedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(invitations.createdAt))
    .get();
  return row?.createdAt.getTime() ?? null;
}

export function pupilDto(db: Pick<Db, 'select'>, row: ChildRow): PupilDto {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    avatar: row.avatar,
    grade: row.grade as GradeId,
    linked: row.familyId !== null,
    codeIssuedAt: row.familyId === null ? pendingCodeAt(db, row.id) : null,
  };
}

/** Ajoute des élèves à une classe (avatars différents tant que possible). */
export function addPupils(
  db: Db,
  auth: AuthContext,
  classId: number,
  list: NewPupil[],
): PupilDto[] {
  const row = getManagedClass(db, auth, classId);
  const defaultGrade = row.grades[0] ?? 'CP';
  for (const p of list)
    if (p.grade && !row.grades.includes(p.grade))
      throw badRequest('invalid_grade', `${p.firstName} : ce niveau n’est pas celui de la classe.`);
  const used = new Map<string, number>(AVATARS.map((a) => [a, 0]));
  for (const p of classPupils(db, row.id)) used.set(p.avatar, (used.get(p.avatar) ?? 0) + 1);
  const nextAvatar = () => {
    const [avatar] = [...used.entries()].sort((a, b) => a[1] - b[1])[0]!;
    used.set(avatar, used.get(avatar)! + 1);
    return avatar;
  };
  const now = new Date();
  return db.transaction((tx) =>
    list.map((p) =>
      pupilDto(
        tx,
        tx
          .insert(children)
          .values({
            familyId: null,
            classId: row.id,
            firstName: p.firstName.trim(),
            lastName: p.lastName?.trim() || null,
            avatar: nextAvatar(),
            grade: p.grade ?? defaultGrade,
            themeId: DEFAULT_THEME_ID,
            createdAt: now,
          })
          .returning()
          .get(),
      ),
    ),
  );
}

export function updatePupil(
  db: Db,
  auth: AuthContext,
  pupil: ChildRow,
  classroom: ClassRow,
  patch: { firstName?: string; lastName?: string | null; grade?: GradeId; classId?: number },
): PupilDto {
  let target = classroom;
  if (patch.classId !== undefined && patch.classId !== classroom.id) {
    target = getManagedClass(db, auth, patch.classId);
    if (target.schoolId !== classroom.schoolId)
      throw badRequest('other_school', 'Cette classe est dans une autre école.');
  }
  const grade = patch.grade ?? pupil.grade;
  if (!target.grades.includes(grade as GradeId))
    throw badRequest('invalid_grade', 'Ce niveau n’est pas celui de la classe.');
  const row = db
    .update(children)
    .set({
      ...(patch.firstName ? { firstName: patch.firstName.trim() } : {}),
      ...(patch.lastName !== undefined ? { lastName: patch.lastName?.trim() || null } : {}),
      grade,
      classId: target.id,
    })
    .where(eq(children.id, pupil.id))
    .returning()
    .get();
  return pupilDto(db, row);
}

/** Les devoirs de la classe pas encore faits, quand l'élève change de classe ou la quitte. */
export function dropPendingClassHomework(tx: Tx, childId: number): void {
  tx.delete(assignments)
    .where(
      and(
        eq(assignments.childId, childId),
        isNotNull(assignments.batch),
        isNull(assignments.completedAt),
      ),
    )
    .run();
}

/**
 * Un élève quitte sa classe : s'il a une famille, il lui reste (sans les devoirs de la classe pas
 * encore faits) ; sinon, son profil n'appartient qu'à l'école et il est supprimé.
 */
export function removeFromClass(tx: Tx, pupil: ChildRow): 'detached' | 'deleted' {
  tx.delete(invitations)
    .where(and(eq(invitations.childId, pupil.id), isNull(invitations.usedAt)))
    .run();
  tx.delete(rolloverChoices).where(eq(rolloverChoices.childId, pupil.id)).run();
  if (pupil.familyId === null) {
    tx.delete(children).where(eq(children.id, pupil.id)).run();
    return 'deleted';
  }
  dropPendingClassHomework(tx, pupil.id);
  tx.update(children).set({ classId: null, lastName: null }).where(eq(children.id, pupil.id)).run();
  return 'detached';
}

/**
 * Fiches parents : un nouveau code par élève sans famille (l'ancien ne marche plus), valable
 * jusqu'à la fin de l'année scolaire. Les codes ne sont renvoyés qu'ici, pour l'impression.
 */
export function issuePupilCodes(
  db: Db,
  auth: AuthContext,
  classId: number,
  pupilIds?: number[],
): PupilCode[] {
  const row = getManagedClass(db, auth, classId);
  const wanted = pupilIds ? new Set(pupilIds) : null;
  const pupils = classPupils(db, row.id).filter(
    (p) => p.familyId === null && (!wanted || wanted.has(p.id)),
  );
  // Jusqu'à la fin de l'année de la classe (une classe de l'année suivante, préparée en juin,
  // garde ses fiches toute l'année), et au moins un mois, même fin août.
  const end = schoolYearEnd(row.schoolYear).getTime();
  const expiresAt = Math.max(end, Date.now() + 30 * 24 * 3600 * 1000);
  return db.transaction((tx) =>
    pupils.map((p) => {
      tx.delete(invitations)
        .where(and(eq(invitations.childId, p.id), isNull(invitations.usedAt)))
        .run();
      const created = createInvitation(tx, {
        role: 'eleve',
        familyId: null,
        schoolId: row.schoolId,
        childId: p.id,
        createdBy: auth.user.id,
        note: `Fiche parent de ${p.firstName}`,
        expiresAt,
      });
      return { pupilId: p.id, ...created };
    }),
  );
}

/** Les sessions d'un enfant qui quitte une famille ne le gardent pas comme profil actif. */
export function forgetActiveChild(tx: Tx, childId: number): void {
  tx.update(authSessions)
    .set({ activeChildId: null })
    .where(eq(authSessions.activeChildId, childId))
    .run();
}
