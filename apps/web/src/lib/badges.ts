import { registry } from '@app/content';
import { STATIC_BADGES, type BadgeDef } from '@app/core';
import { findTheme } from '@app/themes';
import { confetti, toast } from './effects.svelte';
import { session } from './session.svelte';
import { playSound } from './sounds';

/** Nom, icône et indice d'un badge, y compris ceux des notions et des collections. */
export function describeBadge(id: string): BadgeDef {
  const [kind, ref = ''] = id.split(':');
  if (kind === 'notion')
    return {
      id,
      icon: '🏅',
      title: registry.notion(ref)?.title ?? 'Notion acquise',
      hint: 'Acquiers cette notion.',
    };
  if (kind === 'collection') {
    const theme = findTheme(ref);
    return {
      id,
      icon: '👑',
      title: `Collection ${theme?.name ?? ''} complète`,
      hint: 'Obtiens toutes les récompenses de cette ambiance.',
    };
  }
  return STATIC_BADGES.find((b) => b.id === id) ?? { id, icon: '🏅', title: id, hint: '' };
}

/** Fête les nouveaux badges, et les ajoute à l'état de l'enfant. */
export function celebrateBadges(ids: readonly string[]): void {
  if (ids.length === 0) return;
  session.childState?.badges.push(...ids.map((id) => ({ id, earnedAt: Date.now() })));
  const [first] = ids.map(describeBadge);
  toast(
    ids.length === 1
      ? `${first!.icon} Nouveau badge : ${first!.title} !`
      : `🏅 ${ids.length} nouveaux badges !`,
    3500,
  );
  confetti();
  playSound('badge');
}
