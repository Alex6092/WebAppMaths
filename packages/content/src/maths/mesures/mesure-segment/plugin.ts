import { defineLevels, definePlugin, roundCm } from '@app/core';
import { segmentLetters, sideOf, towards } from '../../lib/geometrie';

// GEOM 2, exercice 7 : « MESURE chaque segment avec ta règle. [AB] mesure … cm »

interface Params {
  min: number;
  max: number;
  /** Inclinaison maximale du segment (degrés). */
  tilt: number;
}

interface Data {
  ends: [string, string];
  length: number;
}

const WIDTH = 15;

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'maths.mesures.mesure-segment',
  version: 1,
  title: 'Mesurer un segment',
  description: 'Pose la règle sur le segment et lis sa longueur en centimètres.',
  icon: '📏',
  notions: ['maths.mesures.mesurer-segment'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Segment droit devant', grade: 'CE1', params: { min: 2, max: 10, tilt: 0 } },
    { label: 'Segment penché', grade: 'CE1', params: { min: 3, max: 11, tilt: 20 } },
  ]),

  generate({ rng, params }) {
    const [a, b] = segmentLetters(rng);
    const length = rng.int(params.min, params.max);
    const angle = (rng.next() * 2 - 1) * params.tilt;
    const height = params.tilt > 0 ? 6 : 3.5;
    const center = { x: WIDTH / 2 + (rng.next() - 0.5) * 2, y: height / 2 };
    const start = towards(center, angle, -length / 2);
    const end = towards(center, angle, length / 2);
    return {
      widget: 'number-input',
      instruction: 'MESURE le segment avec ta règle.',
      prompt: `[${a}${b}] mesure {?}`,
      unit: 'cm',
      maxLength: 2,
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
      data: { ends: [a, b], length },
    };
  },

  solve: (q) => ({ value: String(q.data.length) }),

  explain: (q) =>
    `Pose le 0 de la règle sur ${q.data.ends[0]} : ${q.data.ends[1]} est en face du ${q.data.length}. ` +
    `[${q.data.ends.join('')}] mesure ${q.data.length} cm.`,

  invariants(q) {
    const [p, r] = q.figure!.points;
    const d = Math.hypot(r!.x - p!.x, r!.y - p!.y);
    return Math.abs(roundCm(d) - q.data.length) > 0.03 ? 'longueur fausse' : undefined;
  },
});
