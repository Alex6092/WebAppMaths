import { defineLevels, definePlugin } from '@app/core';
import { around, capitalized, DAYS } from '../../lib/temps';

// « Quel jour vient après jeudi ? », puis hier et demain, puis avant-hier et après-demain.

interface Params {
  /** next : le jour d'après ou d'avant ; near : hier, demain ; far : avant-hier, après-demain. */
  ask: 'next' | 'near' | 'far';
}

interface Data {
  day: number;
  shift: number;
  answer: number;
}

const WORD: Record<number, string> = {
  [-2]: 'avant-hier',
  [-1]: 'hier',
  1: 'demain',
  2: 'après-demain',
};

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.temps.quel-jour',
  version: 1,
  title: 'Hier, aujourd’hui, demain',
  description: 'Quel jour étions-nous hier ? Quel jour serons-nous demain ?',
  icon: '🔁',
  notions: ['qlm.temps.semaine'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le jour d’avant, le jour d’après', grade: 'CE1', params: { ask: 'next' } },
    { label: 'Hier et demain', grade: 'CE1', params: { ask: 'near' } },
    { label: 'Avant-hier et après-demain', grade: 'CE1', params: { ask: 'far' } },
  ]),

  generate({ rng, params }) {
    const day = rng.int(0, 6);
    const sign = rng.pick([-1, 1]);
    const shift = params.ask === 'far' ? 2 * sign : sign;
    const answer = around(day, shift, 7);
    const name = DAYS[day]!;
    const prompt =
      params.ask === 'next'
        ? `Quel jour vient ${sign > 0 ? 'après' : 'avant'} ${name} ?`
        : shift > 0
          ? `Aujourd’hui, nous sommes ${name}.\n${capitalized(WORD[shift]!)}, nous serons…`
          : `Aujourd’hui, nous sommes ${name}.\n${capitalized(WORD[shift]!)}, nous étions…`;
    // La bonne réponse, le jour d'aujourd'hui et les jours voisins : les pièges habituels.
    const options = [answer, day, around(day, -shift, 7), around(answer, sign, 7)];
    const choices = [...new Set(options)].sort((a, b) => a - b);
    return {
      widget: 'mcq',
      instruction: 'COCHE le bon jour.',
      prompt,
      choices: choices.map((d) => ({ id: String(d), label: DAYS[d]! })),
      multiple: false,
      layout: 'grid',
      data: { day, shift, answer },
    };
  },

  solve: (q) => ({ selected: [String(q.data.answer)] }),

  explain: (q) => {
    const { day, shift, answer } = q.data;
    const step = Math.abs(shift) === 2 ? 'deux jours' : 'un jour';
    const way = shift > 0 ? 'plus tard' : 'plus tôt';
    return `${capitalized(DAYS[answer]!)} : c’est ${step} ${way} que ${DAYS[day]}.`;
  },
});
