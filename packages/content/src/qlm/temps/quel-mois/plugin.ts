import { defineLevels, definePlugin } from '@app/core';
import { around, capitalized, MONTHS } from '../../lib/temps';

// « Quel mois vient après avril ? », puis « Quel est le 5e mois de l'année ? ».

interface Params {
  /** next : le mois d'après ou d'avant ; rank : le mois à sa place dans l'année. */
  ask: 'next' | 'rank';
}

interface Data {
  answer: number;
}

const ORDINAL = (n: number) => (n === 1 ? '1er' : `${n}e`);

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.temps.quel-mois',
  version: 1,
  title: 'Le mois d’avant, le mois d’après',
  description: 'Quel mois vient après avril ? Quel est le 5e mois de l’année ?',
  icon: '🔢',
  notions: ['qlm.temps.mois-saisons'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le mois d’avant, le mois d’après', grade: 'CE1', params: { ask: 'next' } },
    { label: 'Le 5e mois de l’année', grade: 'CE1', params: { ask: 'rank' } },
  ]),

  generate({ rng, params }) {
    let answer: number;
    let prompt: string;
    let traps: number[];
    if (params.ask === 'next') {
      const month = rng.int(0, 11);
      const sign = rng.pick([-1, 1]);
      answer = around(month, sign, 12);
      prompt = `Quel mois vient ${sign > 0 ? 'après' : 'avant'} ${MONTHS[month]} ?`;
      traps = [month, around(month, -sign, 12), around(answer, sign, 12)];
    } else {
      answer = rng.int(1, 11);
      prompt = `Quel est le ${ORDINAL(answer + 1)} mois de l’année ?`;
      traps = [answer - 1, around(answer, 1, 12), around(answer, 2, 12)];
    }
    const choices = [...new Set([answer, ...traps])].sort((a, b) => a - b);
    return {
      widget: 'mcq',
      instruction: 'COCHE le bon mois.',
      prompt,
      choices: choices.map((m) => ({ id: String(m), label: MONTHS[m]! })),
      multiple: false,
      layout: 'grid',
      data: { answer },
    };
  },

  solve: (q) => ({ selected: [String(q.data.answer)] }),

  explain: (q) =>
    `${capitalized(MONTHS[q.data.answer]!)} est le ${ORDINAL(q.data.answer + 1)} mois de l’année : ${MONTHS.slice(0, q.data.answer + 1).join(', ')}.`,
});
