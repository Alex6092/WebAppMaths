import { registry } from '@app/content';
import { dayKey, STATUS_LABELS } from '@app/core';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import type { AuthContext } from '../auth/session';
import type { Db } from '../db/client';
import { assignments, classrooms, notionAssessments } from '../db/schema';
import { classPupils, requireSchoolRole, type ChildRow, type ClassRow } from './access';
import { latestAssessments } from './assessments';
import { assignmentDto } from './homework';
import { listInvitations } from './invitations';
import { classActiveNotions, classNotions, gradeNotions } from './notions';
import { childMasteries } from './practice';
import { getSchool, schoolDto } from './school';

/**
 * Les données de l'école, pour la direction (archive, droit d'accès, changement d'outil) : l'école,
 * son équipe, ses classes et ce que l'école sait de chaque élève. Rien sur les familles (ni
 * e-mail, ni nom) et pas le détail des réponses, que les parents exportent de leur côté ; jamais
 * d'empreinte de mot de passe ni de code d'invitation.
 */
export function exportSchool(db: Db, auth: AuthContext, schoolId: number) {
  requireSchoolRole(db, auth, schoolId, 'direction');
  const school = getSchool(db, schoolId);
  const dto = schoolDto(db, auth, schoolId);
  const emailOf = (userId: number) => dto.members.find((m) => m.userId === userId)?.email ?? null;
  const rows = db
    .select()
    .from(classrooms)
    .where(eq(classrooms.schoolId, schoolId))
    .orderBy(asc(classrooms.schoolYear), asc(classrooms.name))
    .all();
  return {
    app: 'Cartable magique',
    exportedAt: new Date().toISOString(),
    school: { name: school.name, city: school.city, createdAt: school.createdAt },
    members: dto.members.map((m) => ({
      email: m.email,
      role: m.role,
      classes: dto.classes.filter((c) => m.classIds.includes(c.id)).map((c) => c.name),
    })),
    pendingInvitations: listInvitations(db, schoolId).map((i) => ({
      role: i.role,
      note: i.note,
      createdAt: new Date(i.createdAt),
      expiresAt: new Date(i.expiresAt),
    })),
    classes: rows.map((row) => {
      const seen = new Set(classActiveNotions(db, row));
      return {
        name: row.name,
        schoolYear: row.schoolYear,
        grades: row.grades,
        teachers: (dto.classes.find((c) => c.id === row.id)?.teacherIds ?? []).map(emailOf),
        focusNotions: row.focusNotions,
        notionsNotSeen: classNotions(row).filter((id) => !seen.has(id)),
        pupils: classPupils(db, row.id).map((pupil) => exportPupil(db, pupil)),
      };
    }),
  };
}

function exportPupil(db: Db, pupil: ChildRow) {
  const masteries = childMasteries(db, pupil.id, gradeNotions(pupil));
  return {
    firstName: pupil.firstName,
    lastName: pupil.lastName,
    grade: pupil.grade,
    avatar: pupil.avatar,
    addedAt: pupil.createdAt,
    parentAccount: pupil.familyId !== null,
    acquisition: Object.entries(masteries)
      .filter(([, m]) => m.attempts > 0)
      .map(([notionId, m]) => ({
        notionId,
        notion: registry.notion(notionId)?.title ?? notionId,
        status: m.status,
        mastery: m.mastery,
        questions: m.attempts,
      })),
    assessments: db
      .select({
        notionId: notionAssessments.notionId,
        result: notionAssessments.result,
        assessedOn: notionAssessments.assessedOn,
        title: notionAssessments.title,
      })
      .from(notionAssessments)
      .where(eq(notionAssessments.childId, pupil.id))
      .orderBy(asc(notionAssessments.assessedOn), asc(notionAssessments.id))
      .all()
      .map((a) => ({ ...a, notion: registry.notion(a.notionId)?.title ?? a.notionId })),
    homework: db
      .select()
      .from(assignments)
      .where(and(eq(assignments.childId, pupil.id), isNotNull(assignments.batch)))
      .orderBy(asc(assignments.createdAt), asc(assignments.id))
      .all()
      .map((row) => {
        const a = assignmentDto(db, row);
        return {
          title: a.title,
          notions: a.notions,
          questions: a.questions,
          answered: a.answered,
          dueOn: a.dueOn,
          completedAt: a.completedAt === null ? null : new Date(a.completedAt),
        };
      }),
  };
}

// --- Tableur d'une classe ----------------------------------------------------------------------

/** La marque d'ordre des octets : un tableur lit alors le fichier en UTF-8 (les accents). */
const BOM = String.fromCharCode(0xfeff);

const CSV_HEADER = [
  'Élève',
  'Niveau',
  'Matière',
  'Domaine',
  'Notion',
  'Vue en classe',
  'En ce moment en classe',
  'Acquisition dans l’app (%)',
  'Statut dans l’app',
  'Questions faites',
  'Avis de l’enseignant',
  'Date de l’avis',
  'Évaluation',
];

/**
 * Une cellule CSV : entre guillemets si besoin, et jamais lue comme une formule par le tableur
 * (un prénom qui commencerait par « = » ou « + »).
 */
function cell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const frenchDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Le tableur d'une classe : une ligne par élève et par notion de son niveau (à filtrer ou à
 * croiser dans le tableur), avec l'acquisition mesurée dans l'app et le dernier avis de
 * l'enseignant. Séparateur « ; » et BOM UTF-8, comme l'attend un tableur réglé en français.
 */
export function classCsv(db: Db, row: ClassRow): string {
  const seen = new Set(classActiveNotions(db, row));
  const focus = new Set(row.focusNotions);
  const lines = [CSV_HEADER.map(cell).join(';')];
  for (const pupil of classPupils(db, row.id)) {
    const ids = gradeNotions(pupil);
    const masteries = childMasteries(db, pupil.id, ids);
    const assessments = latestAssessments(db, pupil.id);
    const name = [pupil.firstName, pupil.lastName].filter(Boolean).join(' ');
    for (const id of ids) {
      const notion = registry.notion(id);
      const domain = notion ? registry.domain(notion.domain) : undefined;
      const subject = domain ? registry.subject(domain.subject) : undefined;
      const m = masteries[id];
      const a = assessments[id];
      lines.push(
        [
          name,
          pupil.grade,
          subject?.title ?? '',
          domain?.title ?? '',
          notion?.title ?? id,
          seen.has(id) ? 'oui' : 'non',
          focus.has(id) ? 'oui' : 'non',
          m ? m.mastery : 0,
          STATUS_LABELS[m?.status ?? 'new'],
          m ? m.attempts : 0,
          a?.result ?? '',
          a ? frenchDate(a.assessedOn) : '',
          a?.title ?? '',
        ]
          .map(cell)
          .join(';'),
      );
    }
  }
  return `${BOM}${lines.join('\r\n')}\r\n`;
}

/** « ecole-des-tilleuls-2026-11-04 » : un nom de fichier sans accent ni espace. */
export function fileName(prefix: string, name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefix}-${slug || 'sans-nom'}-${dayKey(new Date())}`;
}
