import type { CheckResult, Mark, MatchAnswer } from '../question';
import type { WidgetDef } from './types';

/** Clé d'un trait dans les marques : la colonne et la carte d'où il part (« 0:2 »). */
export const linkKey = (column: number, card: number) => `${column}:${card}`;

/**
 * Corrige les traits, un par un. same(c, a, b) dit si les cartes a et b de la colonne c sont
 * interchangeables (deux fins de phrase au futur) : relier l'une ou l'autre est juste.
 */
export function compareMatch(
  expected: MatchAnswer,
  given: MatchAnswer,
  same?: (column: number, a: number, b: number) => boolean,
): CheckResult {
  const marks: Record<string, Mark> = {};
  let hits = 0;
  let total = 0;
  expected.links.forEach((row, c) => {
    row.forEach((want, i) => {
      total++;
      const got = given.links[c]?.[i] ?? null;
      const ok = got !== null && (got === want || (want !== null && !!same?.(c + 1, got, want)));
      if (ok) hits++;
      marks[linkKey(c, i)] = got === null ? 'missing' : ok ? 'ok' : 'wrong';
    });
  });
  const correct = hits === total;
  return {
    correct,
    score: hits / Math.max(1, total),
    marks,
    feedback: correct
      ? undefined
      : hits > 0
        ? 'Les bons traits restent en vert : relie les autres ! 💪'
        : 'Relis bien chaque carte et recommence ! 💪',
  };
}

export const matchWidget: WidgetDef<'match'> = {
  id: 'match',

  emptyAnswer: (q) => ({
    links: q.columns.slice(1).map((_, c) => q.columns[c]!.cards.map(() => null)),
  }),

  // Un trait par carte au plus, et chaque carte d'arrivée ne reçoit qu'un trait.
  validate(q, answer): answer is MatchAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { links } = answer as Partial<MatchAnswer>;
    if (!Array.isArray(links) || links.length !== q.columns.length - 1) return false;
    return links.every((row, c) => {
      const targets = q.columns[c + 1]!.cards.length;
      if (!Array.isArray(row) || row.length !== q.columns[c]!.cards.length) return false;
      const used = row.filter((j) => j !== null);
      return (
        new Set(used).size === used.length &&
        used.every((j) => Number.isInteger(j) && j >= 0 && j < targets)
      );
    });
  },

  // Toutes les cartes doivent être reliées.
  isComplete: (_q, answer) => answer.links.every((row) => row.every((j) => j !== null)),

  compare: (_q, expected, given) => compareMatch(expected, given),

  // Les bons traits restent ; les autres s'effacent.
  retryAnswer: (_q, given, result) => ({
    links: given.links.map((row, c) =>
      row.map((j, i) => (result.marks[linkKey(c, i)] === 'ok' ? j : null)),
    ),
  }),

  speech: (q) =>
    q.columns
      .map((column) => {
        const cards = column.cards.map((card) => card.text).join(' ; ');
        return column.title ? `${column.title} : ${cards}` : cards;
      })
      .join('. '),
};
