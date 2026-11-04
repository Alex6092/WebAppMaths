import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import {
  assignments,
  attempts,
  badges,
  children,
  evaluations,
  exerciseStates,
  notionAssessments,
  notionReviews,
  practiceSessions,
  rewardsOwned,
  themesOwned,
} from '../db/schema';
import type { ChildRow } from './access';

/** db ou une transaction en cours. */
type Tx = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

/**
 * Fusionne l'élève créé par l'école (source) dans le profil que la famille avait déjà (target) :
 * un seul profil par enfant. Le profil de la famille garde son id et reçoit la classe ; tout ce
 * que l'élève a fait le rejoint ; pour ce qui n'existe qu'une fois (niveau d'un exercice,
 * révision d'une notion), on garde le plus récent. L'élève source est ensuite supprimé.
 */
export function mergePupilInto(tx: Tx, source: ChildRow, target: ChildRow): void {
  const from = source.id;
  const to = target.id;

  // Historique : il suffit de changer d'enfant.
  for (const table of [practiceSessions, attempts, assignments, evaluations, notionAssessments])
    tx.update(table).set({ childId: to }).where(eq(table.childId, from)).run();

  // Niveaux des exercices : le plus récemment mis à jour.
  for (const s of tx.select().from(exerciseStates).where(eq(exerciseStates.childId, from)).all()) {
    const mine = tx
      .select()
      .from(exerciseStates)
      .where(and(eq(exerciseStates.childId, to), eq(exerciseStates.pluginId, s.pluginId)))
      .get();
    if (mine && mine.updatedAt >= s.updatedAt) continue;
    const { childId: _, ...state } = s;
    tx.insert(exerciseStates)
      .values({ ...state, childId: to })
      .onConflictDoUpdate({ target: [exerciseStates.childId, exerciseStates.pluginId], set: state })
      .run();
  }

  // Révisions espacées : la plus récemment révisée.
  for (const r of tx.select().from(notionReviews).where(eq(notionReviews.childId, from)).all()) {
    const mine = tx
      .select()
      .from(notionReviews)
      .where(and(eq(notionReviews.childId, to), eq(notionReviews.notionId, r.notionId)))
      .get();
    if (mine && (mine.reviewedAt?.getTime() ?? 0) >= (r.reviewedAt?.getTime() ?? 0)) continue;
    const { childId: _, ...review } = r;
    tx.insert(notionReviews)
      .values({ ...review, childId: to })
      .onConflictDoUpdate({ target: [notionReviews.childId, notionReviews.notionId], set: review })
      .run();
  }

  // Récompenses, ambiances, badges : on additionne (sans doublon).
  for (const r of tx.select().from(rewardsOwned).where(eq(rewardsOwned.childId, from)).all())
    tx.insert(rewardsOwned)
      .values({ ...r, childId: to })
      .onConflictDoNothing()
      .run();
  for (const t of tx.select().from(themesOwned).where(eq(themesOwned.childId, from)).all())
    tx.insert(themesOwned)
      .values({ ...t, childId: to })
      .onConflictDoNothing()
      .run();
  for (const b of tx.select().from(badges).where(eq(badges.childId, from)).all())
    tx.insert(badges)
      .values({ ...b, childId: to })
      .onConflictDoNothing()
      .run();

  tx.update(children)
    .set({
      classId: source.classId,
      lastName: source.lastName,
      grade: source.grade,
      coins: target.coins + source.coins,
    })
    .where(eq(children.id, to))
    .run();
  tx.delete(children).where(eq(children.id, from)).run();
}
