import type { Mark, PianoAnswer } from '../question';
import type { WidgetDef } from './types';

export const pianoWidget: WidgetDef<'piano'> = {
  id: 'piano',

  emptyAnswer: () => ({ keys: [] }),

  validate(q, answer): answer is PianoAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { keys } = answer as Partial<PianoAnswer>;
    return (
      Array.isArray(keys) &&
      keys.length <= q.count &&
      keys.every((k) => Number.isInteger(k) && k >= q.from && k <= q.to)
    );
  },

  isComplete: (q, answer) => answer.keys.length === q.count,

  // Chaque touche est corrigée à sa place dans la suite.
  compare(q, expected, given) {
    const marks: Record<string, Mark> = {};
    let hits = 0;
    for (let i = 0; i < q.count; i++) {
      const got = given.keys[i];
      marks[i] = got === undefined ? 'missing' : got === expected.keys[i] ? 'ok' : 'wrong';
      if (marks[i] === 'ok') hits++;
    }
    const correct = hits === q.count;
    return { correct, score: correct ? 1 : 0, marks };
  },

  // On garde les premières touches justes, et on rejoue la suite à partir de la première erreur.
  retryAnswer(_q, given, result) {
    const keys: number[] = [];
    for (const [i, key] of given.keys.entries()) {
      if (result.marks[i] !== 'ok') break;
      keys.push(key);
    }
    return { keys };
  },

  speech: () => '',
};
