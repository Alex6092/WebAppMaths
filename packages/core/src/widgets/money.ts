import { moneyTotal } from '../money';
import type { CheckResult, MoneyAnswer, MoneyQuestion } from '../question';
import type { WidgetDef } from './types';

/** La somme des pièces et des billets entourés. */
export const pickedTotal = (q: MoneyQuestion, answer: MoneyAnswer) =>
  moneyTotal(answer.picked.map((i) => q.purse[i] ?? 0));

/** Juste si la somme donnée est la bonne, quelles que soient les pièces choisies. */
export function compareMoney(q: MoneyQuestion, want: number, given: MoneyAnswer): CheckResult {
  const got = pickedTotal(q, given);
  const correct = got === want;
  return {
    correct,
    score: correct ? 1 : 0,
    marks: { total: correct ? 'ok' : 'wrong' },
    feedback: correct
      ? undefined
      : got < want
        ? 'Ce n’est pas assez : il manque de l’argent. 💪'
        : 'C’est trop : tu donnes plus que le prix. 💪',
  };
}

export const moneyWidget: WidgetDef<'money'> = {
  id: 'money',

  emptyAnswer: () => ({ picked: [] }),

  validate(q, answer): answer is MoneyAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { picked } = answer as Partial<MoneyAnswer>;
    return (
      Array.isArray(picked) &&
      new Set(picked).size === picked.length &&
      picked.every((i) => Number.isInteger(i) && i >= 0 && i < q.purse.length)
    );
  },

  isComplete: (_q, answer) => answer.picked.length > 0,

  compare: (q, expected, given) => compareMoney(q, pickedTotal(q, expected), given),

  // L'enfant garde ce qu'il a entouré et l'ajuste.
  retryAnswer: (_q, given) => ({ picked: [...given.picked] }),

  speech: (q) => q.prompt,
};
