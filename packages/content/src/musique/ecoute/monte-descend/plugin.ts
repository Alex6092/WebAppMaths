import { defineLevels, definePlugin, note, type McqChoice } from '@app/core';
import { MUSIC_GRADE as G, tones } from '../../lib/notes';

// « Ça monte ou ça descend ? » : une petite mélodie à écouter, et sa forme à reconnaître.

type Shape = 'up' | 'down' | 'updown' | 'downup';
interface Params {
  count: number;
  /** Plus grand saut entre deux notes voisines (1 : notes conjointes). */
  leap: number;
  shapes: Shape[];
  /** La courbe dessinée à choisir parmi trois. */
  contour?: boolean;
}
interface Data {
  notes: number[];
  answer: string;
}

const LABELS: Record<Shape, string> = {
  up: 'ça monte',
  down: 'ça descend',
  updown: 'ça monte puis ça descend',
  downup: 'ça descend puis ça remonte',
};

/** Les sauts d'une mélodie de cette forme (positifs : ça monte). */
function moves(
  rng: { int(a: number, b: number): number },
  shape: Shape,
  count: number,
  leap: number,
) {
  const n = count - 1;
  const turn = rng.int(1, n - 1);
  return Array.from({ length: n }, (_, i) => {
    const size = rng.int(1, leap);
    const rising =
      shape === 'up' || (shape === 'updown' && i < turn) || (shape === 'downup' && i >= turn);
    return rising ? size : -size;
  });
}

function build(start: number, steps: number[]): number[] {
  const notes = [start];
  for (const s of steps) notes.push(notes[notes.length - 1]! + s);
  return notes;
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.ecoute.monte-descend',
  version: 1,
  title: 'Ça monte ou ça descend ?',
  description: 'Écoute la mélodie et dis si elle monte ou si elle descend.',
  icon: '📈',
  notions: ['musique.ecoute.melodie'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 5,
  levels: defineLevels<Params>([
    { label: '3 notes voisines', grade: G, params: { count: 3, leap: 1, shapes: ['up', 'down'] } },
    { label: '4 notes', grade: G, params: { count: 4, leap: 1, shapes: ['up', 'down'] } },
    { label: 'Avec des sauts', grade: G, params: { count: 4, leap: 3, shapes: ['up', 'down'] } },
    {
      label: 'Monte puis descend',
      grade: G,
      params: { count: 4, leap: 2, shapes: ['up', 'down', 'updown', 'downup'] },
    },
    {
      label: '5 notes',
      grade: G,
      params: { count: 5, leap: 2, shapes: ['up', 'down', 'updown', 'downup'] },
    },
    {
      label: 'Retrouve la courbe',
      grade: G,
      params: { count: 4, leap: 3, shapes: ['up', 'down', 'updown', 'downup'], contour: true },
    },
  ]),

  generate({ rng, params }) {
    if (params.contour) {
      // Trois courbes différentes : celle de la mélodie et deux autres.
      const seen = new Set<string>();
      const melodies: number[][] = [];
      while (melodies.length < 3) {
        const steps = Array.from(
          { length: params.count - 1 },
          () => rng.int(1, params.leap) * rng.pick([-1, 1]),
        );
        const key = steps.map(Math.sign).join();
        if (seen.has(key)) continue;
        seen.add(key);
        melodies.push(build(rng.int(28, 32), steps));
      }
      const notes = melodies[0]!;
      const order = rng.shuffle([0, 1, 2]);
      const choices: McqChoice[] = order.map((m, i) => ({
        id: 'ABC'[i]!,
        label: 'ABC'[i]!,
        picture: { kind: 'contour', steps: melodies[m]! },
      }));
      return {
        widget: 'mcq',
        instruction: 'ÉCOUTE la mélodie et COCHE sa courbe.',
        tones: tones(notes.map((d) => note(d))),
        choices,
        multiple: false,
        layout: 'grid',
        data: { notes, answer: 'ABC'[order.indexOf(0)]! },
      };
    }
    const shape = rng.pick(params.shapes);
    const notes = build(rng.int(27, 33), moves(rng, shape, params.count, params.leap));
    return {
      widget: 'mcq',
      instruction: 'ÉCOUTE la mélodie. Est-ce qu’elle monte ou qu’elle descend ?',
      tones: tones(notes.map((d) => note(d))),
      choices: params.shapes.map((s) => ({ id: s, label: LABELS[s] })),
      multiple: false,
      layout: params.shapes.length > 2 ? 'list' : 'grid',
      data: { notes, answer: shape },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const label = LABELS[q.data.answer as Shape];
    return label
      ? `Réécoute : ${label} ! 🎵`
      : 'Réécoute en suivant chaque note avec ton doigt : plus aigu, ton doigt monte. 🎵';
  },
});
