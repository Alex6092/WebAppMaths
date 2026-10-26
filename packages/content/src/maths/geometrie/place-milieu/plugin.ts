import { defineLevels, definePlugin, midpoint, roundCm } from '@app/core';
import { segmentLetters, sideOf, towards } from '../../lib/geometrie';

// GEOM 2, exercice 7 : « MESURE chaque segment avec ta règle, puis PLACE son milieu M. »

interface Params {
  /** Longueurs possibles de [AB] (cm). */
  lengths: number[];
  tilt: number;
}

interface Data {
  ends: [string, string];
  length: number;
}

const WIDTH = 15;

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.place-milieu',
  version: 1,
  title: 'Place le milieu',
  description: 'Mesure le segment avec la règle, puis place son milieu M.',
  icon: '📍',
  notions: ['maths.geometrie.milieu-tracer'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Longueur paire', grade: 'CE1', params: { lengths: [4, 6, 8, 10, 12], tilt: 0 } },
    { label: 'Segment penché', grade: 'CE1', params: { lengths: [4, 6, 8, 10], tilt: 20 } },
    { label: 'Au demi-centimètre', grade: 'CE1', params: { lengths: [3, 5, 7, 9, 11], tilt: 15 } },
  ]),

  generate({ rng, params }) {
    const [a, b] = segmentLetters(rng);
    const length = rng.pick(params.lengths);
    const angle = (rng.next() * 2 - 1) * params.tilt;
    const height = params.tilt > 0 ? 6 : 3.5;
    const center = { x: WIDTH / 2 + (rng.next() - 0.5) * 2, y: height / 2 };
    const start = towards(center, angle, -length / 2);
    const end = towards(center, angle, length / 2);
    return {
      widget: 'geometry',
      instruction: `MESURE le segment [${a}${b}] avec ta règle, puis PLACE son milieu M.`,
      figure: {
        width: WIDTH,
        height,
        ruler: true,
        points: [
          { id: a, label: a, ...start, mark: 'tick', labelAt: sideOf(angle) },
          { id: b, label: b, ...end, mark: 'tick', labelAt: sideOf(angle) },
        ],
        segments: [{ from: a, to: b }],
      },
      tools: [{ kind: 'place', labels: ['M'] }],
      tolerance: 0.3,
      data: { ends: [a, b], length },
    };
  },

  solve(q) {
    const [p, r] = q.figure.points;
    const m = midpoint(p!, r!);
    return { picked: [], drawn: [], placed: [{ id: 'M', x: roundCm(m.x), y: roundCm(m.y) }] };
  },

  explain: (q) =>
    `[${q.data.ends.join('')}] mesure ${q.data.length} cm. La moitié de ${q.data.length} est ` +
    `${String(q.data.length / 2).replace('.', ',')} : M est à ${String(q.data.length / 2).replace('.', ',')} cm de ${q.data.ends[0]}.`,
});
