import {
  checkGeometry,
  defineLevels,
  definePlugin,
  distance,
  midpoint,
  roundCm,
  type GeometryAnswer,
  type PluginQuestion,
} from '@app/core';
import { segmentLetters } from '../../lib/geometrie';

// GEOM 2, exercice 8 : « TRACE le segment demandé, puis PLACE son milieu M. »
// Tracer [GH] de 6 cm : poser la règle sur G et placer H à la graduation 6.

interface Params {
  lengths: number[];
  /** Un trait en pointillés montre la direction. */
  guide: boolean;
}

interface Data {
  ends: [string, string];
  length: number;
}

const WIDTH = 15;
const HEIGHT = 4;
const TOLERANCE = 0.3;

function solve(q: PluginQuestion<'geometry', Data>): GeometryAnswer {
  const [a, b] = q.data.ends;
  const start = q.figure.points.find((p) => p.id === a)!;
  const end = { x: roundCm(start.x + q.data.length), y: start.y };
  const m = midpoint(start, end);
  return {
    picked: [],
    drawn: [],
    placed: [
      { id: b, ...end },
      { id: 'M', x: roundCm(m.x), y: roundCm(m.y) },
    ],
  };
}

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.trace-segment-milieu',
  version: 1,
  title: 'Trace un segment et son milieu',
  description: 'Trace un segment de la bonne longueur, puis place son milieu.',
  icon: '✏️',
  notions: ['maths.geometrie.milieu-tracer', 'maths.mesures.mesurer-segment'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec un guide', grade: 'CE1', params: { lengths: [4, 6, 8, 10], guide: true } },
    {
      label: 'Sans guide',
      grade: 'CE1',
      params: { lengths: [4, 5, 6, 7, 8, 9, 10], guide: false },
    },
  ]),

  generate({ rng, params }) {
    const [a, b] = segmentLetters(rng);
    const length = rng.pick(params.lengths);
    const start = { x: roundCm(1.2 + rng.next() * (WIDTH - 2.6 - length)), y: 2 };
    return {
      widget: 'geometry',
      instruction: `TRACE le segment [${a}${b}] de ${length} cm, puis PLACE son milieu M.`,
      figure: {
        width: WIDTH,
        height: HEIGHT,
        ruler: true,
        points: [
          { id: a, label: a, ...start, mark: 'tick' },
          ...(params.guide
            ? [{ id: 'guide', x: roundCm(start.x + 1), y: start.y, mark: 'none' as const }]
            : []),
        ],
        // Le segment se dessine dès que l'enfant a placé la deuxième extrémité.
        segments: [
          ...(params.guide ? [{ from: a, to: 'guide', kind: 'line' as const, dashed: true }] : []),
          { from: a, to: b },
        ],
      },
      tools: [{ kind: 'place', labels: [b, 'M'] }],
      tolerance: TOLERANCE,
      data: { ends: [a, b], length },
    };
  },

  solve,

  check(q, answer) {
    const [a, b] = q.data.ends;
    const start = q.figure.points.find((p) => p.id === a)!;
    const end = answer.placed.find((p) => p.id === b);
    return checkGeometry(q, solve(q), answer, {
      placed: (p) =>
        p.id === b
          ? Math.abs(distance(start, p) - q.data.length) <= TOLERANCE
          : end !== undefined && distance(p, midpoint(start, end)) <= TOLERANCE,
    });
  },

  explain: (q) => {
    const [a, b] = q.data.ends;
    return (
      `Pose le 0 de la règle sur ${a} et place ${b} en face du ${q.data.length}. ` +
      `Puis place M à ${String(q.data.length / 2).replace('.', ',')} cm de ${a}.`
    );
  },
});
