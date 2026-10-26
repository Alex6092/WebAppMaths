import { asc, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  assignments,
  attempts,
  authSessions,
  badges,
  children,
  evaluations,
  exerciseStates,
  families,
  notionReviews,
  notionSettings,
  parentUsers,
  practiceSessions,
  rewardsOwned,
  themesOwned,
} from '../db/schema';
import { forbidden, notFound } from '../errors';

/**
 * Toutes les données d'une famille, lisibles (JSON) : comptes parents (sans les mots de passe),
 * profils des enfants et tout ce qu'ils ont fait dans l'app.
 */
export function exportFamily(db: Db, familyId: number) {
  const family = db.select().from(families).where(eq(families.id, familyId)).get();
  if (!family) throw notFound('family_not_found', 'Famille introuvable.');
  const parents = db
    .select({ email: parentUsers.email, role: parentUsers.role, createdAt: parentUsers.createdAt })
    .from(parentUsers)
    .where(eq(parentUsers.familyId, familyId))
    .all();
  const devices = db
    .select({
      userAgent: authSessions.userAgent,
      createdAt: authSessions.createdAt,
      lastSeenAt: authSessions.lastSeenAt,
    })
    .from(authSessions)
    .where(eq(authSessions.familyId, familyId))
    .all();
  const kids = db
    .select()
    .from(children)
    .where(eq(children.familyId, familyId))
    .orderBy(asc(children.id))
    .all();
  return {
    app: 'Cartable magique',
    exportedAt: new Date().toISOString(),
    family: { name: family.name, createdAt: family.createdAt },
    parents,
    devices,
    children: kids.map((child) => ({
      ...child,
      sessions: db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.childId, child.id))
        .orderBy(asc(practiceSessions.id))
        .all(),
      attempts: db
        .select()
        .from(attempts)
        .where(eq(attempts.childId, child.id))
        .orderBy(asc(attempts.id))
        .all(),
      levels: db.select().from(exerciseStates).where(eq(exerciseStates.childId, child.id)).all(),
      rewards: db.select().from(rewardsOwned).where(eq(rewardsOwned.childId, child.id)).all(),
      themes: db.select().from(themesOwned).where(eq(themesOwned.childId, child.id)).all(),
      badges: db.select().from(badges).where(eq(badges.childId, child.id)).all(),
      notionsSeen: db
        .select()
        .from(notionSettings)
        .where(eq(notionSettings.childId, child.id))
        .all(),
      reviews: db.select().from(notionReviews).where(eq(notionReviews.childId, child.id)).all(),
      assignments: db.select().from(assignments).where(eq(assignments.childId, child.id)).all(),
      evaluations: db.select().from(evaluations).where(eq(evaluations.childId, child.id)).all(),
    })),
  };
}

/**
 * Supprime la famille et tout ce qui s'y rattache (les clés étrangères suppriment en cascade
 * parents, appareils, invitations vers la famille, enfants et leurs données). Le compte
 * administrateur ne se supprime pas ici.
 */
export function deleteFamily(db: Db, familyId: number): void {
  const users = db
    .select({ id: parentUsers.id, role: parentUsers.role })
    .from(parentUsers)
    .where(eq(parentUsers.familyId, familyId))
    .all();
  if (users.some((u) => u.role === 'admin'))
    throw forbidden('admin_family', 'La famille de l’administrateur ne peut pas être supprimée.');
  db.delete(families).where(eq(families.id, familyId)).run();
}
