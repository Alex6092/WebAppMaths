import {
  EVALUATION_CODES,
  GRADE_IDS,
  type ChildReport,
  type ClassAssessmentDto,
  type ClassAssignmentDto,
  type ClassOverview,
  type ClassroomDetail,
  type ClassroomDto,
  type GradeId,
  type NewClassAssessment,
  type NewClassAssignment,
  type NewPupil,
  type PupilCode,
  type PupilDto,
  type RolloverChoice,
  type RolloverDto,
  type RolloverResult,
  type SchoolDto,
  type SchoolRole,
} from '@app/core';
import type { FastifyInstance } from 'fastify';
import { requireParent } from '../auth/session';
import { notFound } from '../errors';
import { getManagedClass, getPupil } from '../services/access';
import {
  classAssessments,
  classAssignments,
  classLevels,
  classOverview,
  createClassAssignment,
  deleteClassAssessment,
  deleteClassAssignment,
  saveClassAssessment,
} from '../services/classwork';
import { setClassNotions } from '../services/notions';
import { classCsv, exportSchool, fileName } from '../services/school-export';
import { applyRollover, rolloverDto, setRolloverChoices } from '../services/rollover';
import { childReport } from '../services/report';
import {
  addPupils,
  classroomDetail,
  createClass,
  deleteClass,
  inviteMember,
  issuePupilCodes,
  removeFromClass,
  removeMember,
  revokeSchoolInvitation,
  schoolDto,
  setMemberRole,
  updateClass,
  updatePupil,
  updateSchool,
  type ClassInput,
} from '../services/school';
import type { Deps } from './deps';

const ID = { type: 'integer' } as const;
const ID_PARAMS = { params: { type: 'object', properties: { id: ID } } } as const;
const SCHOOL_ROLE = { type: 'string', enum: ['direction', 'enseignant'] } as const;
const NOTION_ID = { type: 'string', maxLength: 100 } as const;
const NOTION_LIST = { type: 'array', maxItems: 200, items: NOTION_ID } as const;
const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;
const BATCH = { type: 'string', minLength: 1, maxLength: 60 } as const;
const CLASS_FIELDS = {
  name: { type: 'string', minLength: 1, maxLength: 40 },
  grades: {
    type: 'array',
    minItems: 1,
    maxItems: 3,
    items: { type: 'string', enum: [...GRADE_IDS] },
  },
  schoolYear: { type: 'string', pattern: '^\\d{4}-\\d{4}$' },
  teacherIds: { type: 'array', maxItems: 20, items: ID },
  focusNotions: { type: 'array', maxItems: 12, items: NOTION_ID },
} as const;
const PUPIL_FIELDS = {
  firstName: { type: 'string', minLength: 1, maxLength: 30 },
  lastName: { type: ['string', 'null'], maxLength: 40 },
  grade: { type: 'string', enum: [...GRADE_IDS] },
} as const;

/**
 * Espace école : la direction gère l'école (enseignants, classes, élèves), l'enseignant ses
 * classes. Même déverrouillage que l'espace parent (aucun pour un compte sans famille).
 */
export function schoolRoutes(api: FastifyInstance, { db }: Deps): void {
  // --- École ---

  api.get<{ Params: { id: number } }>(
    '/schools/:id',
    { schema: ID_PARAMS },
    async (req): Promise<SchoolDto> => schoolDto(db, requireParent(req), req.params.id),
  );

  api.patch<{ Params: { id: number }; Body: { name?: string; city?: string | null } }>(
    '/schools/:id',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 80 },
            city: { type: ['string', 'null'], maxLength: 80 },
          },
        },
      },
    },
    async (req): Promise<SchoolDto> => {
      const auth = requireParent(req);
      updateSchool(db, auth, req.params.id, req.body);
      return schoolDto(db, auth, req.params.id);
    },
  );

  api.post<{ Params: { id: number }; Body: { role?: SchoolRole; note?: string } }>(
    '/schools/:id/invitations',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { role: SCHOOL_ROLE, note: { type: 'string', maxLength: 100 } },
        },
      },
    },
    async (req) =>
      inviteMember(
        db,
        requireParent(req),
        req.params.id,
        req.body.role ?? 'enseignant',
        req.body.note?.trim() || null,
      ),
  );

  api.delete<{ Params: { id: number; invitationId: number } }>(
    '/schools/:id/invitations/:invitationId',
    { schema: { params: { type: 'object', properties: { id: ID, invitationId: ID } } } },
    async (req) => {
      revokeSchoolInvitation(db, requireParent(req), req.params.id, req.params.invitationId);
      return { ok: true };
    },
  );

  api.patch<{ Params: { id: number; userId: number }; Body: { role: SchoolRole } }>(
    '/schools/:id/members/:userId',
    {
      schema: {
        params: { type: 'object', properties: { id: ID, userId: ID } },
        body: {
          type: 'object',
          required: ['role'],
          additionalProperties: false,
          properties: { role: SCHOOL_ROLE },
        },
      },
    },
    async (req): Promise<SchoolDto> => {
      const auth = requireParent(req);
      setMemberRole(db, auth, req.params.id, req.params.userId, req.body.role);
      return schoolDto(db, auth, req.params.id);
    },
  );

  api.delete<{ Params: { id: number; userId: number } }>(
    '/schools/:id/members/:userId',
    { schema: { params: { type: 'object', properties: { id: ID, userId: ID } } } },
    async (req) => {
      removeMember(db, requireParent(req), req.params.id, req.params.userId);
      return { ok: true };
    },
  );

  // --- Données de l'école ---

  /** Toutes les données de l'école, en JSON (direction). */
  api.get<{ Params: { id: number } }>(
    '/schools/:id/export',
    { schema: ID_PARAMS },
    async (req, reply) => {
      const data = exportSchool(db, requireParent(req), req.params.id);
      reply.header(
        'Content-Disposition',
        `attachment; filename="${fileName('ecole', data.school.name)}.json"`,
      );
      return data;
    },
  );

  /** Le tableur d'une classe : acquisition et avis de chaque élève, notion par notion. */
  api.get<{ Params: { id: number } }>(
    '/classes/:id/export.csv',
    { schema: ID_PARAMS },
    async (req, reply) => {
      const row = getManagedClass(db, requireParent(req), req.params.id);
      return reply
        .type('text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${fileName('classe', row.name)}.csv"`)
        .send(classCsv(db, row));
    },
  );

  // --- Rentrée (direction) ---

  api.get<{ Params: { id: number } }>(
    '/schools/:id/rollover',
    { schema: ID_PARAMS },
    async (req): Promise<RolloverDto> => rolloverDto(db, requireParent(req), req.params.id),
  );

  api.put<{ Params: { id: number }; Body: { choices: RolloverChoice[] } }>(
    '/schools/:id/rollover',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          required: ['choices'],
          additionalProperties: false,
          properties: {
            choices: {
              type: 'array',
              minItems: 1,
              maxItems: 400,
              items: {
                type: 'object',
                required: ['pupilId'],
                additionalProperties: false,
                properties: {
                  pupilId: ID,
                  classId: { type: ['integer', 'null'] },
                  grade: { type: 'string', enum: [...GRADE_IDS] },
                  leaves: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (req): Promise<RolloverDto> =>
      setRolloverChoices(db, requireParent(req), req.params.id, req.body.choices),
  );

  api.post<{ Params: { id: number } }>(
    '/schools/:id/rollover/apply',
    { schema: ID_PARAMS },
    async (req): Promise<RolloverResult> => applyRollover(db, requireParent(req), req.params.id),
  );

  // --- Classes ---

  api.post<{ Params: { id: number }; Body: ClassInput & { name: string; grades: GradeId[] } }>(
    '/schools/:id/classes',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          required: ['name', 'grades'],
          additionalProperties: false,
          properties: CLASS_FIELDS,
        },
      },
    },
    async (req): Promise<ClassroomDto> =>
      createClass(db, requireParent(req), req.params.id, req.body),
  );

  api.get<{ Params: { id: number } }>(
    '/classes/:id',
    { schema: ID_PARAMS },
    async (req): Promise<ClassroomDetail> => classroomDetail(db, requireParent(req), req.params.id),
  );

  api.patch<{ Params: { id: number }; Body: ClassInput }>(
    '/classes/:id',
    {
      schema: {
        ...ID_PARAMS,
        body: { type: 'object', additionalProperties: false, properties: CLASS_FIELDS },
      },
    },
    async (req): Promise<ClassroomDetail> =>
      updateClass(db, requireParent(req), req.params.id, req.body),
  );

  api.delete<{ Params: { id: number } }>('/classes/:id', { schema: ID_PARAMS }, async (req) => {
    deleteClass(db, requireParent(req), req.params.id);
    return { ok: true };
  });

  /** Coche ou décoche des notions « vues en classe » pour toute la classe. */
  api.patch<{ Params: { id: number }; Body: { notionIds: string[]; active: boolean } }>(
    '/classes/:id/notions',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          required: ['notionIds', 'active'],
          additionalProperties: false,
          properties: { notionIds: NOTION_LIST, active: { type: 'boolean' } },
        },
      },
    },
    async (req) => {
      const row = getManagedClass(db, requireParent(req), req.params.id);
      return { activeNotions: setClassNotions(db, row, req.body.notionIds, req.body.active) };
    },
  );

  // --- Élèves ---

  api.post<{ Params: { id: number }; Body: { pupils: NewPupil[] } }>(
    '/classes/:id/pupils',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          required: ['pupils'],
          additionalProperties: false,
          properties: {
            pupils: {
              type: 'array',
              minItems: 1,
              maxItems: 40,
              items: {
                type: 'object',
                required: ['firstName'],
                additionalProperties: false,
                properties: PUPIL_FIELDS,
              },
            },
          },
        },
      },
    },
    async (req): Promise<PupilDto[]> =>
      addPupils(db, requireParent(req), req.params.id, req.body.pupils),
  );

  api.patch<{
    Params: { id: number };
    Body: { firstName?: string; lastName?: string | null; grade?: GradeId; classId?: number };
  }>(
    '/pupils/:id',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { ...PUPIL_FIELDS, classId: ID },
        },
      },
    },
    async (req): Promise<PupilDto> => {
      const auth = requireParent(req);
      const { pupil, classroom } = getPupil(db, auth, req.params.id);
      return updatePupil(db, auth, pupil, classroom, req.body);
    },
  );

  /** Retire l'élève de la classe : il reste à sa famille, ou il est supprimé s'il n'en a pas. */
  api.delete<{ Params: { id: number } }>('/pupils/:id', { schema: ID_PARAMS }, async (req) => {
    const { pupil } = getPupil(db, requireParent(req), req.params.id);
    return { removed: db.transaction((tx) => removeFromClass(tx, pupil)) };
  });

  /** Le bilan d'un élève (le même que celui du parent). */
  api.get<{ Params: { id: number } }>(
    '/pupils/:id/report',
    { schema: ID_PARAMS },
    async (req): Promise<ChildReport> =>
      childReport(db, getPupil(db, requireParent(req), req.params.id).pupil),
  );

  /** Fiches parents : de nouveaux codes, montrés une seule fois, pour l'impression. */
  api.post<{ Params: { id: number }; Body: { pupilIds?: number[] } }>(
    '/classes/:id/pupil-codes',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { pupilIds: { type: 'array', maxItems: 60, items: ID } },
        },
      },
    },
    async (req): Promise<PupilCode[]> =>
      issuePupilCodes(db, requireParent(req), req.params.id, req.body.pupilIds),
  );

  // --- Travail de la classe ---

  api.get<{ Params: { id: number } }>('/classes/:id/levels', { schema: ID_PARAMS }, async (req) =>
    classLevels(db, getManagedClass(db, requireParent(req), req.params.id)),
  );

  api.get<{ Params: { id: number } }>(
    '/classes/:id/overview',
    { schema: ID_PARAMS },
    async (req): Promise<ClassOverview> =>
      classOverview(db, getManagedClass(db, requireParent(req), req.params.id)),
  );

  api.get<{ Params: { id: number } }>(
    '/classes/:id/assignments',
    { schema: ID_PARAMS },
    async (req): Promise<ClassAssignmentDto[]> =>
      classAssignments(db, getManagedClass(db, requireParent(req), req.params.id)),
  );

  api.post<{ Params: { id: number }; Body: NewClassAssignment }>(
    '/classes/:id/assignments',
    {
      schema: {
        ...ID_PARAMS,
        body: {
          type: 'object',
          required: ['title', 'notions', 'questions', 'dueOn'],
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 80 },
            notions: { ...NOTION_LIST, minItems: 1, maxItems: 50 },
            questions: { type: 'integer', minimum: 1, maximum: 50 },
            dueOn: DATE,
            pupilIds: { type: 'array', minItems: 1, maxItems: 60, items: ID },
          },
        },
      },
    },
    async (req): Promise<ClassAssignmentDto> => {
      const auth = requireParent(req);
      return createClassAssignment(db, auth, getManagedClass(db, auth, req.params.id), req.body);
    },
  );

  api.delete<{ Params: { id: number; batch: string } }>(
    '/classes/:id/assignments/:batch',
    { schema: { params: { type: 'object', properties: { id: ID, batch: BATCH } } } },
    async (req) => {
      const row = getManagedClass(db, requireParent(req), req.params.id);
      deleteClassAssignment(db, row, req.params.batch);
      return { ok: true };
    },
  );

  const ASSESSMENT_BODY = {
    type: 'object',
    required: ['title', 'assessedOn', 'notions', 'results'],
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 80 },
      assessedOn: DATE,
      notions: { ...NOTION_LIST, minItems: 1, maxItems: 20 },
      results: {
        type: 'object',
        maxProperties: 60,
        additionalProperties: {
          type: 'object',
          maxProperties: 20,
          additionalProperties: { type: 'string', enum: [...EVALUATION_CODES] },
        },
      },
    },
  } as const;

  api.get<{ Params: { id: number } }>(
    '/classes/:id/assessments',
    { schema: ID_PARAMS },
    async (req): Promise<ClassAssessmentDto[]> =>
      classAssessments(db, getManagedClass(db, requireParent(req), req.params.id)),
  );

  api.post<{ Params: { id: number }; Body: NewClassAssessment }>(
    '/classes/:id/assessments',
    { schema: { ...ID_PARAMS, body: ASSESSMENT_BODY } },
    async (req): Promise<ClassAssessmentDto> => {
      const auth = requireParent(req);
      return saveClassAssessment(db, auth, getManagedClass(db, auth, req.params.id), req.body);
    },
  );

  /** Corrige une saisie (les résultats remplacent ceux de la même évaluation). */
  api.put<{ Params: { id: number; batch: string }; Body: NewClassAssessment }>(
    '/classes/:id/assessments/:batch',
    {
      schema: {
        params: { type: 'object', properties: { id: ID, batch: BATCH } },
        body: ASSESSMENT_BODY,
      },
    },
    async (req): Promise<ClassAssessmentDto> => {
      const auth = requireParent(req);
      const row = getManagedClass(db, auth, req.params.id);
      if (!classAssessments(db, row).some((a) => a.batch === req.params.batch))
        throw notFound('assessment_not_found', 'Évaluation introuvable.');
      return saveClassAssessment(db, auth, row, req.body, req.params.batch);
    },
  );

  api.delete<{ Params: { id: number; batch: string } }>(
    '/classes/:id/assessments/:batch',
    { schema: { params: { type: 'object', properties: { id: ID, batch: BATCH } } } },
    async (req) => {
      const row = getManagedClass(db, requireParent(req), req.params.id);
      deleteClassAssessment(db, row, req.params.batch);
      return { ok: true };
    },
  );
}
