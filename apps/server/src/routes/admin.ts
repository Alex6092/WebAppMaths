import type { AdminSchoolDto, CreatedInvitation, Role } from '@app/core';
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/session';
import { invitations } from '../db/schema';
import { notFound } from '../errors';
import { createInvitation, listInvitations } from '../services/invitations';
import { adminSchools, createSchool, deleteSchool, getSchool } from '../services/school';
import type { Deps } from './deps';

/** Invitation pour la direction d'une école : 14 jours pour s'inscrire. */
function directionInvitation(db: Deps['db'], schoolId: number, createdBy: number) {
  const school = getSchool(db, schoolId);
  return createInvitation(db, {
    role: 'direction',
    familyId: null,
    schoolId,
    createdBy,
    note: `Direction : ${school.name}`,
    expiresInDays: 14,
  });
}

/** Invitations de nouvelles familles et écoles : réservé à l'administrateur. */
export function adminRoutes(api: FastifyInstance, { db }: Deps): void {
  api.get('/admin/invitations', async (req) => {
    requireAdmin(req);
    return listInvitations(db);
  });

  api.post<{ Body: { role?: Role; note?: string; expiresInDays?: number } }>(
    '/admin/invitations',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            role: { type: 'string', enum: ['admin', 'parent'] },
            note: { type: 'string', maxLength: 100 },
            expiresInDays: { type: 'integer', minimum: 1, maximum: 30 },
          },
        },
      },
    },
    async (req) => {
      const auth = requireAdmin(req);
      return createInvitation(db, {
        role: req.body.role ?? 'parent',
        familyId: null,
        createdBy: auth.user.id,
        note: req.body.note ?? null,
        expiresInDays: req.body.expiresInDays ?? 7,
      });
    },
  );

  api.delete<{ Params: { id: number } }>(
    '/admin/invitations/:id',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req) => {
      requireAdmin(req);
      const removed = db
        .delete(invitations)
        .where(and(eq(invitations.id, req.params.id), isNull(invitations.usedAt)))
        .returning({ id: invitations.id })
        .get();
      if (!removed)
        throw notFound('invitation_not_found', 'Invitation introuvable ou déjà utilisée.');
      return { ok: true };
    },
  );

  api.get('/admin/schools', async (req): Promise<AdminSchoolDto[]> => {
    requireAdmin(req);
    return adminSchools(db);
  });

  /** Crée une école et l'invitation de sa direction. */
  api.post<{ Body: { name: string; city?: string } }>(
    '/admin/schools',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 80 },
            city: { type: 'string', maxLength: 80 },
          },
        },
      },
    },
    async (req): Promise<{ id: number; invitation: CreatedInvitation }> => {
      const auth = requireAdmin(req);
      const school = createSchool(db, req.body);
      return { id: school.id, invitation: directionInvitation(db, school.id, auth.user.id) };
    },
  );

  api.post<{ Params: { id: number } }>(
    '/admin/schools/:id/invitations',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req): Promise<CreatedInvitation> => {
      const auth = requireAdmin(req);
      return directionInvitation(db, req.params.id, auth.user.id);
    },
  );

  /** Supprime l'école : ses élèves sans famille aussi ; ceux d'une famille restent à la famille. */
  api.delete<{ Params: { id: number } }>(
    '/admin/schools/:id',
    { schema: { params: { type: 'object', properties: { id: { type: 'integer' } } } } },
    async (req) => {
      requireAdmin(req);
      deleteSchool(db, req.params.id);
      return { ok: true };
    },
  );
}
