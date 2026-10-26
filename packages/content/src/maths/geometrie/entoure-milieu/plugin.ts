import { defineLevels, definePlugin, distance, midpoint, roundCm, type FigPoint } from '@app/core';
import { retry } from '../../../lib/numbers';
import { lettersAfter, segmentLetters, sideOf, towards } from '../../lib/geometrie';

// GEOM 2, exercice 4 : « ENTOURE le point qui est le milieu du segment. Utilise ta règle. »

interface Params {
  candidates: number;
  /** Écart minimal et maximal des autres points au milieu (cm). */
  offset: [number, number];
  tilt: number;
  ruler: boolean;
}

interface Data {
  ends: [string, string];
  length: number;
  middle: string;
}

const WIDTH = 15;
const HEIGHT = 5;

export default definePlugin<'geometry', Params, Data>('geometry', {
  id: 'maths.geometrie.entoure-milieu',
  version: 1,
  title: 'Trouve le milieu',
  description: 'Entoure le point qui partage le segment en deux parties égales.',
  icon: '🎯',
  notions: ['maths.geometrie.milieu-reconnaitre'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'Ça se voit',
      grade: 'CE1',
      params: { candidates: 3, offset: [1.2, 2.5], tilt: 0, ruler: false },
    },
    {
      label: 'Avec la règle',
      grade: 'CE1',
      params: { candidates: 3, offset: [0.9, 1.3], tilt: 0, ruler: true },
    },
    {
      label: 'Segment penché',
      grade: 'CE1',
      params: { candidates: 4, offset: [0.9, 1.3], tilt: 12, ruler: true },
    },
  ]),

  generate({ rng, params }) {
    const [a, b] = segmentLetters(rng);
    const length = 2 * rng.int(4, 6);
    const angle = (rng.next() * 2 - 1) * params.tilt;
    const center = { x: WIDTH / 2 + rng.next() - 0.5, y: HEIGHT / 2 + (rng.next() - 0.5) * 0.6 };
    const start = towards(center, angle, -length / 2);
    const end = towards(center, angle, length / 2);
    const mid = midpoint(start, end);
    // Les autres points : de part et d'autre du milieu, à des écarts différents.
    const [lo, hi] = params.offset;
    const shifts = retry(
      () =>
        Array.from({ length: params.candidates - 1 }, () => {
          const d = lo + rng.next() * (hi - lo) + (rng.chance(0.4) ? 1.5 : 0);
          return roundCm(rng.chance(0.5) ? d : -d);
        }),
      (list) =>
        [0, ...list].every((d, i, all) => all.every((e, j) => i === j || Math.abs(d - e) >= 0.9)) &&
        list.every((d) => Math.abs(d) < length / 2 - 0.6),
    );
    const along = [0, ...shifts].sort((p, q) => p - q);
    const names = lettersAfter(b, params.candidates, [a, 'M']);
    const points: FigPoint[] = [
      { id: a, label: a, ...start, mark: 'tick', labelAt: sideOf(angle) },
      { id: b, label: b, ...end, mark: 'tick', labelAt: sideOf(angle) },
      ...along.map((d, i) => ({
        id: names[i]!,
        label: names[i]!,
        ...towards(mid, angle, d),
        mark: 'tick' as const,
        labelAt: sideOf(angle),
      })),
    ];
    const middle = names[along.indexOf(0)]!;
    return {
      widget: 'geometry',
      instruction: `ENTOURE le point qui est le milieu du segment [${a}${b}].${params.ruler ? ' Utilise ta règle.' : ''}`,
      figure: {
        width: WIDTH,
        height: HEIGHT,
        points,
        segments: [{ from: a, to: b }],
        ...(params.ruler ? { ruler: true } : {}),
      },
      tools: [{ kind: 'pick', targets: names }],
      data: { ends: [a, b], length, middle },
    };
  },

  solve: (q) => ({ picked: [q.data.middle], drawn: [], placed: [] }),

  explain: (q) => {
    const [a, b] = q.data.ends;
    return `[${a}${b}] mesure ${q.data.length} cm. Le milieu est à ${q.data.length / 2} cm de ${a} et de ${b} : c’est le point ${q.data.middle}.`;
  },

  invariants(q) {
    const [a, b] = q.data.ends.map((id) => q.figure.points.find((p) => p.id === id)!);
    const m = q.figure.points.find((p) => p.id === q.data.middle)!;
    if (Math.abs(distance(a!, m) - distance(m, b!)) > 0.05) return 'milieu faux';
    return undefined;
  },
});
