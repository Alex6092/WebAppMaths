import type { Role } from '@app/core';
import { and, eq, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/session';
import { invitations } from '../db/schema';
import { notFound } from '../errors';
import { createInvitation, listInvitations } from '../services/invitations';
import type { Deps } from './deps';

/** Invitations de nouvelles familles : réservé à l'administrateur. */
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
}
