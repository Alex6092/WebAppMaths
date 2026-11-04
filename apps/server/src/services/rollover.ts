import {
  nextGrade,
  schoolYearOf,
  type GradeId,
  type RolloverChoice,
  type RolloverChoiceDto,
  type RolloverDto,
  type RolloverResult,
} from '@app/core';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import { children, classrooms, rolloverChoices } from '../db/schema';
import { badRequest, conflict, notFound } from '../errors';
import { classPupils, requireSchoolRole, type ChildRow, type ClassRow } from './access';
import { classroomDto, dropPendingClassHomework, pupilDto, removeFromClass } from './school';

/**
 * La rentrée : la direction répartit les élèves de l'année qui finit dans les classes de
 * l'année suivante (ou les fait partir de l'école), puis la déclenche quand elle veut.
 */

type ChoiceRow = typeof rolloverChoices.$inferSelect;

/** L'année qui finit : la plus ancienne des classes de l'école ; et la suivante. */
export function rolloverYears(db: Pick<Db, 'select'>, schoolId: number) {
  const years = [
    ...new Set(
      db
        .select({ year: classrooms.schoolYear })
        .from(classrooms)
        .where(eq(classrooms.schoolId, schoolId))
        .all()
        .map((r) => r.year),
    ),
  ].sort();
  const from = years[0] ?? schoolYearOf(new Date());
  const start = Number(from.split('-')[0]);
  return { from, to: `${start + 1}-${start + 2}` };
}

function classesOf(db: Pick<Db, 'select'>, schoolId: number, year: string): ClassRow[] {
  return db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.schoolId, schoolId), eq(classrooms.schoolYear, year)))
    .orderBy(asc(classrooms.name))
    .all();
}

/** Le niveau suivant s'il est dans la classe, sinon le même (maintien), sinon son premier. */
export function defaultGrade(grade: GradeId, target: ClassRow): GradeId {
  const next = nextGrade(grade);
  if (next && target.grades.includes(next)) return next;
  if (target.grades.includes(grade)) return grade;
  return target.grades[0] ?? grade;
}

function choicesOf(db: Pick<Db, 'select'>, pupils: ChildRow[]): Map<number, ChoiceRow> {
  if (pupils.length === 0) return new Map();
  return new Map(
    db
      .select()
      .from(rolloverChoices)
      .where(
        inArray(
          rolloverChoices.childId,
          pupils.map((p) => p.id),
        ),
      )
      .all()
      .map((c) => [c.childId, c]),
  );
}

function choiceDto(
  pupil: ChildRow,
  choice: ChoiceRow | undefined,
  targets: Map<number, ClassRow>,
): RolloverChoiceDto {
  if (!choice) return null;
  if (choice.leaves) return 'quitte';
  const target = choice.toClassId !== null ? targets.get(choice.toClassId) : undefined;
  if (!target) return null;
  return {
    classId: target.id,
    grade: choice.grade ?? defaultGrade(pupil.grade as GradeId, target),
  };
}

/** Les classes et les élèves de l'année qui finit, avec leur choix ; les classes d'arrivée. */
function plan(db: Pick<Db, 'select'>, schoolId: number) {
  const years = rolloverYears(db, schoolId);
  const fromClasses = classesOf(db, schoolId, years.from);
  const toClasses = classesOf(db, schoolId, years.to);
  const targets = new Map(toClasses.map((c) => [c.id, c]));
  const pupilsByClass = new Map(fromClasses.map((c) => [c.id, classPupils(db, c.id)]));
  const pupils = [...pupilsByClass.values()].flat();
  const choices = choicesOf(db, pupils);
  return { years, fromClasses, toClasses, targets, pupilsByClass, pupils, choices };
}

export function rolloverDto(db: Db, auth: AuthContext, schoolId: number): RolloverDto {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const p = plan(db, schoolId);
  return {
    from: p.years.from,
    to: p.years.to,
    fromClasses: p.fromClasses.map((c) => ({
      id: c.id,
      name: c.name,
      grades: c.grades,
      pupils: (p.pupilsByClass.get(c.id) ?? []).map((pupil) => ({
        ...pupilDto(db, pupil),
        choice: choiceDto(pupil, p.choices.get(pupil.id), p.targets),
      })),
    })),
    toClasses: p.toClasses.map((c) => classroomDto(db, c)),
  };
}

/** Enregistre des choix (un élève, ou toute une classe d'un coup). */
export function setRolloverChoices(
  db: Db,
  auth: AuthContext,
  schoolId: number,
  choices: RolloverChoice[],
): RolloverDto {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const p = plan(db, schoolId);
  const pupils = new Map(p.pupils.map((pupil) => [pupil.id, pupil]));
  const now = new Date();
  db.transaction((tx) => {
    for (const c of choices) {
      const pupil = pupils.get(c.pupilId);
      if (!pupil) throw notFound('pupil_not_found', 'Élève introuvable.');
      if (!c.leaves && (c.classId === undefined || c.classId === null)) {
        tx.delete(rolloverChoices).where(eq(rolloverChoices.childId, pupil.id)).run();
        continue;
      }
      let values: Omit<ChoiceRow, 'childId'>;
      if (c.leaves) values = { toClassId: null, grade: null, leaves: true, updatedAt: now };
      else {
        const target = p.targets.get(c.classId!);
        if (!target)
          throw badRequest('invalid_class', `Choisis une classe de l’année ${p.years.to}.`);
        const grade = c.grade ?? defaultGrade(pupil.grade as GradeId, target);
        if (!target.grades.includes(grade))
          throw badRequest(
            'invalid_grade',
            `${pupil.firstName} : ce niveau n’est pas celui de la classe.`,
          );
        values = { toClassId: target.id, grade, leaves: false, updatedAt: now };
      }
      tx.insert(rolloverChoices)
        .values({ childId: pupil.id, ...values })
        .onConflictDoUpdate({ target: rolloverChoices.childId, set: values })
        .run();
    }
  });
  return rolloverDto(db, auth, schoolId);
}

/**
 * Fait la rentrée : chaque élève passe dans sa nouvelle classe (sans les devoirs de l'ancienne
 * pas encore faits), ceux qui partent quittent l'école, et les classes de l'année qui finit sont
 * supprimées. Tous les élèves doivent avoir un choix.
 */
export function applyRollover(db: Db, auth: AuthContext, schoolId: number): RolloverResult {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const p = plan(db, schoolId);
  if (p.fromClasses.length === 0)
    throw badRequest('nothing_to_do', 'Aucune classe à faire passer.');
  const decided = p.pupils.map((pupil) => ({
    pupil,
    choice: choiceDto(pupil, p.choices.get(pupil.id), p.targets),
  }));
  const missing = decided.filter((d) => d.choice === null).length;
  if (missing > 0)
    throw conflict(
      'pupils_unassigned',
      `${missing} élève${missing > 1 ? 's' : ''} à répartir avant la rentrée.`,
    );
  const result: RolloverResult = { moved: 0, detached: 0, deleted: 0 };
  db.transaction((tx) => {
    for (const { pupil, choice } of decided) {
      if (choice === 'quitte') {
        result[removeFromClass(tx, pupil)]++;
        continue;
      }
      dropPendingClassHomework(tx, pupil.id);
      tx.update(children)
        .set({ classId: choice!.classId, grade: choice!.grade })
        .where(eq(children.id, pupil.id))
        .run();
      result.moved++;
    }
    const ids = p.pupils.map((pupil) => pupil.id);
    if (ids.length > 0)
      tx.delete(rolloverChoices).where(inArray(rolloverChoices.childId, ids)).run();
    tx.delete(classrooms)
      .where(
        inArray(
          classrooms.id,
          p.fromClasses.map((c) => c.id),
        ),
      )
      .run();
  });
  return result;
}
