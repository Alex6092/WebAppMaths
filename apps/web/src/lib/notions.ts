import { registry } from '@app/content';
import { NEW_MASTERY, type GradeId, type NotionMastery, type NotionStatus } from '@app/core';
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

/** Les notions d'un mélange : une portée (all, matière, domaine, notion) ou une liste « a,b,c ». */
export function mixNotions(
  scope: string | undefined,
  list: string | null,
  grade: GradeId,
): string[] {
  if (list) return list.split(',').filter((id) => registry.notion(id));
  return registry.notionsInScope(scope ?? 'all', grade).map((n) => n.id);
}
