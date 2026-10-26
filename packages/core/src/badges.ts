/**
 * Badges : gagnés une fois pour toutes, même si une notion redevient « en cours ».
 * Les badges de notion (notion:<id>) et de collection (collection:<thème>) prennent leur nom
 * dans le catalogue et les thèmes ; les autres sont décrits ici.
 */

export interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  /** Ce qu'il faut faire pour le gagner. */
  hint: string;
}

/** Un badge à palier : tant de défis, de jours de suite, de questions. */
export interface CountBadge extends BadgeDef {
  kind: 'daily' | 'streak' | 'questions';
  count: number;
}

const counted = (
  kind: CountBadge['kind'],
  icon: string,
  steps: number[],
  title: (n: number) => string,
  hint: (n: number) => string,
): CountBadge[] =>
  steps.map((count) => ({
    id: `${kind}-${count}`,
    kind,
    count,
    icon,
    title: title(count),
    hint: hint(count),
  }));

export const STATIC_BADGES: readonly CountBadge[] = [
  ...counted(
    'daily',
    '🎯',
    [1, 10, 30],
    (n) => (n === 1 ? 'Premier défi' : `${n} défis du jour`),
    (n) => (n === 1 ? 'Réussis ton premier défi du jour.' : `Réussis ${n} défis du jour.`),
  ),
  ...counted(
    'streak',
    '🔥',
    [3, 7, 14, 30],
    (n) => `${n} jours de suite`,
    (n) => `Fais le défi du jour ${n} jours de suite.`,
  ),
  ...counted(
    'questions',
    '💯',
    [100, 500, 1000],
    (n) => `${n} questions`,
    (n) => `Réponds à ${n} questions.`,
  ),
];

export const notionBadgeId = (notionId: string) => `notion:${notionId}`;
export const collectionBadgeId = (themeId: string) => `collection:${themeId}`;

/** Ce que l'enfant a fait, pour savoir quels badges il mérite. */
export interface BadgeProgress {
  acquiredNotions: readonly string[];
  completedCollections: readonly string[];
  dailyDone: number;
  bestStreak: number;
  questions: number;
}

/** Les badges mérités qui ne sont pas encore gagnés. */
export function newBadges(progress: BadgeProgress, earned: ReadonlySet<string>): string[] {
  const deserved = [
    ...progress.acquiredNotions.map(notionBadgeId),
    ...progress.completedCollections.map(collectionBadgeId),
    ...STATIC_BADGES.filter((b) => {
      if (b.kind === 'daily') return progress.dailyDone >= b.count;
      if (b.kind === 'streak') return progress.bestStreak >= b.count;
      return progress.questions >= b.count;
    }).map((b) => b.id),
  ];
  return deserved.filter((id) => !earned.has(id));
}
