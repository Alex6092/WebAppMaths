import { defineLevels, definePlugin } from '@app/core';
import { conversion, LENGTH_NOTION, metresAndCm, speakLength } from '../../lib/longueurs';

const SIGNS = [
  { id: 'lt', label: '<' },
  { id: 'eq', label: '=' },
  { id: 'gt', label: '>' },
];

export default definePlugin('mcq', {
  id: 'maths.mesures.compare-longueurs',
  version: 1,
  title: 'Choisis le signe entre deux longueurs',
  icon: '📏',
  notions: [LENGTH_NOTION],
  expectedLevel: 2,
  printExplanation: true,
  levels: defineLevels([
    { label: 'Avec des mètres entiers', grade: 'CE1', params: { mixed: false } },
    { label: 'Avec des mètres et des centimètres', grade: 'CE1', params: { mixed: true } },
  ]),

  generate({ rng, params }) {
    const measure = rng.int(1, 5) * 100 + (params.mixed ? rng.int(1, 99) : 0);
    const other = rng.chance(0.25) ? measure : measure + rng.pick([-1, 1]) * rng.int(1, 70);
    const shown = metresAndCm(measure);
    const reversed = rng.chance(0.5);
    const [left, right] = reversed ? [other, measure] : [measure, other];
    const [first, second] = reversed ? [`${other} cm`, shown] : [shown, `${other} cm`];
    const sign = SIGNS[left < right ? 0 : left === right ? 1 : 2]!;
    return {
      widget: 'mcq',
      instruction: 'COMPARE les longueurs avec <, > ou =.',
      speech: `Compare ${speakLength(first)} et ${speakLength(second)}. Choisis plus petit que, égal ou plus grand que.`,
      prompt: `${first} {?} ${second}`,
      choices: SIGNS,
      multiple: false,
      layout: 'row',
      data: { left, right, measure, sign },
    };
  },

  solve: (q) => ({ selected: [q.data.sign.id] }),
  explain: (q) =>
    `Je convertis en centimètres. ${conversion(q.data.measure)}. Je compare ensuite ${q.data.left} cm et ${q.data.right} cm : ${q.data.left} cm ${q.data.sign.label} ${q.data.right} cm.`,
  signature: (q) => q.prompt!,
});
