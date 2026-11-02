import {
  defineLevels,
  definePlugin,
  isBlackKey,
  noteName,
  noteOfMidi,
  STEP_NAMES,
  type McqChoice,
} from '@app/core';
import { MUSIC_GRADE as G } from '../../lib/notes';

// « Comment s'appelle cette touche ? » : une touche marquée sur le clavier, son nom à cocher.

interface Params {
  /** Le clavier (touches blanches de début et de fin). */
  keys: [number, number];
  /** Les touches qu'on peut marquer : leurs noms (do = 0… si = 6), ou les touches noires. */
  steps?: number[];
  black?: boolean;
  labels?: boolean;
}
interface Data {
  key: number;
  answer: string;
}

const blackName = (midi: number) =>
  `${noteName(noteOfMidi(midi))} ou ${noteName(noteOfMidi(midi, true))}`;

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.instruments.piano-nom',
  version: 1,
  title: 'Le nom des touches',
  description: 'Une touche est marquée : coche son nom.',
  icon: '🎹',
  notions: ['musique.instruments.piano'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 5,
  levels: defineLevels<Params>([
    {
      label: 'Le do et ses voisines',
      grade: G,
      params: { keys: [48, 71], steps: [0, 1, 6], labels: true },
    },
    {
      label: 'Le do et le fa',
      grade: G,
      params: { keys: [48, 71], steps: [0, 3, 2, 4], labels: true },
    },
    {
      label: 'Une octave',
      grade: G,
      params: { keys: [60, 71], steps: [0, 1, 2, 3, 4, 5, 6], labels: true },
    },
    {
      label: 'Deux octaves',
      grade: G,
      params: { keys: [48, 71], steps: [0, 1, 2, 3, 4, 5, 6], labels: true },
    },
    { label: 'Sans aide', grade: G, params: { keys: [48, 71], steps: [0, 1, 2, 3, 4, 5, 6] } },
    {
      label: 'Les touches noires',
      grade: G,
      params: { keys: [60, 71], black: true, labels: true },
    },
  ]),

  generate({ rng, params }) {
    const [from, to] = params.keys;
    const all = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    const candidates = params.black
      ? all.filter(isBlackKey)
      : all.filter((k) => !isBlackKey(k) && params.steps!.includes(noteOfMidi(k).d % 7));
    const key = rng.pick(candidates);
    let choices: McqChoice[];
    let answer: string;
    if (params.black) {
      answer = blackName(key);
      choices = all.filter(isBlackKey).map((k) => ({ id: blackName(k), label: blackName(k) }));
    } else {
      answer = STEP_NAMES[noteOfMidi(key).d % 7]!;
      const steps = [...new Set(params.steps!)].sort((a, b) => a - b);
      choices = steps.map((s) => ({ id: STEP_NAMES[s]!, label: STEP_NAMES[s]! }));
    }
    return {
      widget: 'mcq',
      instruction: 'COCHE le nom de la touche marquée.',
      picture: {
        kind: 'keyboard',
        from,
        to,
        marks: [key],
        ...(params.labels ? { labels: true } : {}),
      },
      choices,
      multiple: false,
      layout: choices.length > 4 ? (params.black ? 'list' : 'row') : 'grid',
      data: { key, answer },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    if (isBlackKey(q.data.key))
      return `Cette touche noire est à droite d’un ${noteName(noteOfMidi(q.data.key - 1))} : c’est un ${q.data.answer}.`;
    return `C’est un ${q.data.answer}. Repère le do, juste à gauche des 2 touches noires, puis compte : do, ré, mi, fa, sol, la, si.`;
  },
});
