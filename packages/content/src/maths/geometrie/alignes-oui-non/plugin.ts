import { defineLevels, definePlugin, distanceToLine, roundCm } from '@app/core';
import { angleOf, lerp, sideOf, YES_NO } from '../../lib/geometrie';

// GEOM 1 : vérifier à la règle si trois points sont alignés.

interface Params {
  /** Écart du point qui n'est pas aligné (cm) : petit, il faut la règle pour le voir. */
  offset: [number, number];
}

interface Data {
  aligned: boolean;
  /** Le point du milieu, celui qui est (ou non) sur la droite. */
  middle: string;
}

const WIDTH = 15;
const HEIGHT = 6;

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'maths.geometrie.alignes-oui-non',
  version: 1,
  title: 'Alignés ou pas ?',
  description: 'Vérifie avec la règle si les trois points sont alignés.',
  icon: '🔍',
  notions: ['maths.geometrie.alignes-identifier'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Ça se voit', grade: 'CE1', params: { offset: [0.9, 1.6] } },
    { label: 'Avec la règle', grade: 'CE1', params: { offset: [0.3, 0.6] } },
  ]),

  generate({ rng, params }) {
    const a = { x: roundCm(1 + rng.next()), y: roundCm(1 + rng.next() * 4) };
    const b = { x: roundCm(12.5 + rng.next()), y: roundCm(1 + rng.next() * 4) };
    const angle = angleOf(a, b);
    const aligned = rng.chance(0.5);
    const t = 0.3 + rng.next() * 0.4;
    const base = lerp(a, b, t);
    const [lo, hi] = params.offset;
    // Décalage perpendiculaire à [AB], vers le centre de la figure.
    const shift = aligned ? 0 : (lo + rng.next() * (hi - lo)) * (base.y < HEIGHT / 2 ? 1 : -1);
    const rad = (angle * Math.PI) / 180;
    const c = {
      x: roundCm(base.x - shift * Math.sin(rad)),
      y: roundCm(base.y + shift * Math.cos(rad)),
    };
    const [first, middle, last] = rng.shuffle(['A', 'B', 'C']);
    return {
      widget: 'mcq',
      instruction: `Les points A, B et C sont-ils alignés ? Vérifie avec ta règle.`,
      figure: {
        width: WIDTH,
        height: HEIGHT,
        ruler: true,
        points: [
          { id: first!, label: first!, ...a, labelAt: sideOf(angle) },
          { id: last!, label: last!, ...b, labelAt: sideOf(angle) },
          { id: middle!, label: middle!, ...c, labelAt: sideOf(angle, true) },
        ],
      },
      choices: YES_NO,
      multiple: false,
      layout: 'row',
      data: { aligned: distanceToLine(c, a, b) < 0.05, middle: middle! },
    };
  },

  solve: (q) => ({ selected: [q.data.aligned ? 'oui' : 'non'] }),

  explain: (q) =>
    q.data.aligned
      ? 'Le bord de la règle passe par les trois points : ils sont alignés.'
      : `Le point ${q.data.middle} est à côté du bord de la règle : les trois points ne sont pas alignés.`,

  invariants(q, { params }) {
    const [p, r, s] = q.figure!.points;
    const gap = distanceToLine(s!, p!, r!);
    if (!q.data.aligned && gap < params.offset[0] - 0.05) return 'écart trop petit';
    return undefined;
  },
});
