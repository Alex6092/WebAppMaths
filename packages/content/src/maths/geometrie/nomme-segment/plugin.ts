import { compareBlanks, defineLevels, definePlugin, roundCm, type FigPoint } from '@app/core';
import { lerp, segmentLetters, sideOf, towards } from '../../lib/geometrie';

// GEOM 2, exercice 3 : « ÉCRIS le nom de chaque segment et de ses extrémités. »

interface Params {
  /** Un point M sur le segment : ce n'est pas une extrémité. */
  middle: boolean;
}

interface Data {
  ends: [string, string];
}

const WIDTH = 12;
const HEIGHT = 4;

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.geometrie.nomme-segment',
  version: 1,
  title: 'Nommer un segment',
  description: 'Écris le nom du segment, [KL], et ses extrémités.',
  icon: '🔠',
  notions: ['maths.geometrie.segment'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Un segment', grade: 'CE1', params: { middle: false } },
    { label: 'Avec un point au milieu', grade: 'CE1', params: { middle: true } },
  ]),

  generate({ rng, params }) {
    const [a, b] = rng.chance(0.5) ? segmentLetters(rng) : segmentLetters(rng).reverse();
    const start = { x: roundCm(1.5 + rng.next()), y: roundCm(1 + rng.next() * 2) };
    const angle = (rng.next() * 2 - 1) * 15;
    const end = towards(start, angle, 7 + rng.next() * 2);
    const points: FigPoint[] = [
      { id: a!, label: a!, ...start, mark: 'tick', labelAt: sideOf(angle) },
      { id: b!, label: b!, ...end, mark: 'tick', labelAt: sideOf(angle) },
    ];
    if (params.middle) {
      points.push({
        id: 'M',
        label: 'M',
        ...lerp(start, end, 0.5),
        mark: 'tick',
        labelAt: sideOf(angle),
      });
    }
    const upper = { kind: 'text', size: 2, upper: true } as const;
    return {
      widget: 'fill-blank',
      instruction: 'ÉCRIS le nom du segment et de ses extrémités.',
      prompt: 'Ce segment s’écrit [{0}].\nSes extrémités sont les points {1} et {2}.',
      blanks: [upper, { ...upper, size: 1 }, { ...upper, size: 1 }],
      caseSensitive: true,
      figure: {
        width: WIDTH,
        height: HEIGHT,
        points,
        segments: [{ from: a!, to: b! }],
      },
      data: { ends: [a!, b!] },
    };
  },

  solve: (q) => {
    const [a, b] = q.data.ends;
    return { values: [`${a}${b}`, a, b] };
  },

  // [KL] ou [LK], « K et L » ou « L et K » : tout est juste.
  check(q, answer) {
    const [a, b] = q.data.ends;
    const [first, second] = answer.values[1]?.toUpperCase() === b ? [b, a] : [a, b];
    return compareBlanks(q, [[`${a}${b}`, `${b}${a}`], [first], [second]], answer);
  },

  explain: (q) => {
    const [a, b] = q.data.ends;
    return `Le segment va de ${a} à ${b} : il s’écrit [${a}${b}], ses extrémités sont ${a} et ${b}.`;
  },
});
