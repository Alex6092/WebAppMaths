import { registry } from '@app/content';
import {
  isDue,
  NEW_MASTERY,
  type GradeId,
  type NotionMastery,
  type NotionReview,
  type NotionStatus,
} from '@app/core';
import { session } from './session.svelte';

/** Les codes de l'école, dits avec les mots d'un enfant. */
export const STATUS_LABELS: Record<NotionStatus, string> = {
  new: 'À découvrir',
  NA: 'À travailler',
  ECA: 'En cours',
  A: 'Acquis',
};

export function masteryOf(notionId: string): NotionMastery {
  return session.childState?.notions[notionId] ?? NEW_MASTERY;
}

export function reviewOf(notionId: string): NotionReview | undefined {
  return session.childState?.reviews[notionId];
}

/** Notions à réviser aujourd'hui (révision espacée). */
export function dueNotions(now = Date.now()): string[] {
  return Object.entries(session.childState?.reviews ?? {})
    .filter(([, review]) => isDue(review, now))
    .map(([id]) => id);
}

/**
 * Les notions d'un mélange : une portée (all, matière, domaine, notion) ou une liste « a,b,c ».
 * Une portée ne garde que les notions vues en classe (toutes, si aucune n'est encore vue).
 */
export function mixNotions(
  scope: string | undefined,
  list: string | null,
  grade: GradeId,
): string[] {
  if (list) return list.split(',').filter((id) => registry.notion(id));
  const ids = registry.notionsInScope(scope ?? 'all', grade).map((n) => n.id);
  return seenAmong(ids);
}

/** Celles des notions qui sont vues en classe, ou toutes si aucune ne l'est. */
export function seenAmong(ids: string[]): string[] {
  const active = session.childState?.activeNotions;
  if (!active) return ids;
  const seen = ids.filter((id) => active.includes(id));
  return seen.length ? seen : ids;
}

/** La notion est-elle vue en classe ? (oui tant que l'état de l'enfant n'est pas chargé) */
export function isSeen(notionId: string): boolean {
  return session.childState?.activeNotions.includes(notionId) ?? true;
}
