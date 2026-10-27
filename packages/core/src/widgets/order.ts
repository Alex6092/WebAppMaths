import type { CheckResult, Mark, OrderAnswer, OrderQuestion } from '../question';
import type { WidgetDef } from './types';

/** Le texte reconstitué : les étiquettes dans l'ordre, la ponctuation collée (ou des virgules). */
export function orderText(q: OrderQuestion, order: readonly number[]): string {
  const gap = q.list ? ', ' : ' ';
  return order
    .map((index, i) => {
      const tile = q.tiles[index];
      if (!tile) return '';
      return (i > 0 && !tile.glue ? gap : '') + tile.text;
    })
    .join('');
}

/**
 * Corrige un ordre : juste s'il donne le même texte qu'un des ordres admis (deux étiquettes
 * identiques sont interchangeables). Les marques disent, place par place, ce qui est bien placé
 * par rapport à l'ordre admis le plus proche.
 */
export function compareOrder(
  q: OrderQuestion,
  accepted: readonly (readonly number[])[],
  given: OrderAnswer,
): CheckResult {
  const textAt = (order: readonly number[], i: number) => q.tiles[order[i] ?? -1]?.text;
  let best: { marks: Record<string, Mark>; hits: number } | null = null;
  for (const want of accepted) {
    const marks: Record<string, Mark> = {};
    let hits = 0;
    want.forEach((_, i) => {
      if (given.order[i] === undefined) marks[i] = 'missing';
      else if (textAt(given.order, i) === textAt(want, i)) {
        marks[i] = 'ok';
        hits++;
      } else marks[i] = 'wrong';
    });
    if (!best || hits > best.hits) best = { marks, hits };
  }
  const total = q.tiles.length;
  const correct = best !== null && best.hits === total && given.order.length === total;
  const marks = best?.marks ?? {};
  // Au deuxième essai, seul le début juste reste posé : le message le dit.
  const kept = given.order.findIndex((_, i) => marks[i] !== 'ok');
  return {
    correct,
    score: correct ? 1 : (best?.hits ?? 0) / Math.max(1, total),
    marks,
    feedback: correct
      ? undefined
      : kept > 0
        ? 'Le début est juste, il reste en vert. Continue ! 💪'
        : 'Ce n’est pas le bon ordre : recommence depuis le début ! 💪',
  };
}

export const orderWidget: WidgetDef<'order'> = {
  id: 'order',

  emptyAnswer: () => ({ order: [] }),

  validate(q, answer): answer is OrderAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { order } = answer as Partial<OrderAnswer>;
    return (
      Array.isArray(order) &&
      order.length <= q.tiles.length &&
      new Set(order).size === order.length &&
      order.every((i) => Number.isInteger(i) && i >= 0 && i < q.tiles.length)
    );
  },

  // Toutes les étiquettes doivent être posées.
  isComplete: (q, answer) => answer.order.length === q.tiles.length,

  compare: (q, expected, given) => compareOrder(q, [expected.order], given),

  // On garde le début juste ; la suite retourne dans la réserve.
  retryAnswer(_q, given, result) {
    const keep = given.order.findIndex((_, i) => result.marks[i] !== 'ok');
    return { order: keep < 0 ? [...given.order] : given.order.slice(0, keep) };
  },

  speech: (q) => q.tiles.map((t) => t.text).join(', '),
};
