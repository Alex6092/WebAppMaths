import { registry } from '@app/content';
import {
  canPractice,
  isDue,
  NEW_MASTERY,
  type AnyPlugin,
  type GradeId,
  type NotionMastery,
  type NotionReview,
} from '@app/core';
import { session } from './session.svelte';

// Les codes de l'école, dits avec les mots d'un enfant (partagés avec le tableur de la classe).
export { STATUS_LABELS } from '@app/core';

export function masteryOf(notionId: string): NotionMastery {
  return session.childState?.notions[notionId] ?? NEW_MASTERY;
}

export function reviewOf(notionId: string): NotionReview | undefined {
  return session.childState?.reviews[notionId];
}

/** Notions à réviser aujourd'hui (révision espacée). */
export function dueNotions(now = Date.now()): string[] {
  return playableNotions(
    Object.entries(session.childState?.reviews ?? {})
      .filter(([, review]) => isDue(review, now))
      .map(([id]) => id),
  );
}

/**
 * Les notions demandées pour un mélange. Le serveur les croise avec les réglages actuels.
 */
export function mixNotions(
  scope: string | undefined,
  list: string | null,
  grade: GradeId,
): string[] {
  if (list !== null) return list.split(',').filter((id) => registry.notion(id));
  return registry.notionsInScope(scope ?? 'all', grade).map((n) => n.id);
}

export function practicePlugins(plugins: readonly AnyPlugin[] = registry.plugins): AnyPlugin[] {
  const active = new Set(session.childState?.activeNotions);
  return plugins.filter((plugin) => canPractice(plugin, active));
}

export function playableNotions(ids: readonly string[]): string[] {
  const playable = new Set(practicePlugins().flatMap((plugin) => plugin.notions));
  return ids.filter((id) => playable.has(id));
}

/** La notion est-elle vue en classe ? (oui tant que l'état de l'enfant n'est pas chargé) */
export function isSeen(notionId: string): boolean {
  return session.childState?.activeNotions.includes(notionId) ?? true;
}
