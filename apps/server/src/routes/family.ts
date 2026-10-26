import { GRADE_IDS, type ChildDto, type ChildReport, type GradeId } from '@app/core';
import { DEFAULT_THEME_ID } from '@app/themes';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireParent } from '../auth/session';
import { children } from '../db/schema';
import { getFamilyChild, toChildDto } from '../services/family';
import { createInvitation } from '../services/invitations';
import { childReport } from '../services/report';
import type { Deps } from './deps';

const CHILD_FIELDS = {
  firstName: { type: 'string', minLength: 1, maxLength: 30 },
  avatar: { type: 'string', minLength: 1, maxLength: 16 },
  grade: { type: 'string', enum: [...GRADE_IDS] },
} as const;

type ChildBody = { firstName: string; avatar: string; grade: GradeId };

/** Gestion de la famille : réservée à l'espace parent déverrouillé. */
export function familyRoutes(api: FastifyInstance, { db }: Deps): void {
  api.post<{ Body: ChildBody }>(
    '/children',
    {
      schema: {
        body: {
          type: 'object',
          required: ['firstName', 'avatar', 'grade'],
          additionalProperties: false,
          properties: CHILD_FIELDS,
        },
      },
    },
    async (req): Promise<ChildDto> => {
      const auth = requireParent(req);
      const row = db
        .insert(children)
        .values({
          familyId: auth.familyId,
          firstName: req.body.firstName.trim(),
          avatar: req.body.avatar,
          grade: req.body.grade,
          themeId: DEFAULT_THEME_ID,
          createdAt: new Date(),
        })
        .returning()
        .get();
      return toChildDto(row);
    },
  );

  api.patch<{ Params: { id: number }; Body: Partial<ChildBody> & { coins?: number } }>(
    '/children/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'integer' } } },
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { ...CHILD_FIELDS, coins: { type: 'integer', minimum: 0, maximum: 100000 } },
        },
      },
    },
    async (req): Promise<ChildDto> => {
      const auth = requireParent(req);
      const child = getFamilyChild(db, auth.familyId, req.params.id);
      const { firstName, ...rest } = req.body;
      const row = db
        .update(children)
        .set({ ...rest, ...(firstName ? { firstName: firstName.trim() } : {}) })
        .where(eq(children.id, child.id))
        .returning()
        .get();
      return toChildDto(row);
    },
  );

  api.delete<{ Params: { id: number } }>(
    '/children/:id',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req) => {
      const auth = requireParent(req);
      const child = getFamilyChild(db, auth.familyId, req.params.id);
      db.delete(children).where(eq(children.id, child.id)).run();
      return { ok: true };
    },
  );

  /** Bilan d'un enfant : acquisition, activité, séances et erreurs fréquentes. */
  api.get<{ Params: { id: number } }>(
    '/children/:id/report',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req): Promise<ChildReport> => {
      const auth = requireParent(req);
      return childReport(db, getFamilyChild(db, auth.familyId, req.params.id));
    },
  );

  /** Invite un second parent dans la famille. */
  api.post('/family/invitations', async (req) => {
    const auth = requireParent(req);
    return createInvitation(db, {
      role: 'parent',
      familyId: auth.familyId,
      createdBy: auth.user.id,
      note: 'Second parent',
    });
  });
}
