import {
  defineLevels,
  definePlugin,
  midiOf,
  note,
  noteName,
  type Clef,
  type Note,
  type StaffItem,
} from '@app/core';
import { MUSIC_GRADE as G, randomAccidental, staff } from '../../lib/notes';

// « TOUCHE la touche du piano » : une note écrite, et le clavier pour la jouer.

interface Params {
  treble?: [number, number];
  bass?: [number, number];
  /** Le clavier : touches blanches de début et de fin (numéros MIDI). */
  keys: [number, number];
  count?: number;
  labels?: boolean;
  /** Des dièses et des bémols : les touches noires. */
  acc?: boolean;
}
interface Data {
  clef: Clef | 'grand';
  notes: Note[];
}

export default definePlugin<'piano', Params, Data>('piano', {
  id: 'musique.instruments.piano-touche',
  version: 1,
  title: 'Joue la note au piano',
  description: 'Lis la note et touche la bonne touche du clavier.',
  icon: '🎹',
  notions: ['musique.instruments.piano'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 5,
  levels: defineLevels<Params>([
    {
      label: 'Main droite : do à sol',
      grade: G,
      params: { treble: [28, 32], keys: [60, 71], labels: true },
    },
    {
      label: 'Main droite : une octave',
      grade: G,
      params: { treble: [28, 35], keys: [60, 72], labels: true },
    },
    {
      label: 'Main gauche : fa à do',
      grade: G,
      params: { bass: [24, 28], keys: [53, 64], labels: true },
    },
    {
      label: 'Les deux mains',
      grade: G,
      params: { treble: [28, 35], bass: [21, 28], keys: [48, 72], labels: true },
    },
    {
      label: 'Avec les lignes en plus',
      grade: G,
      params: { treble: [26, 41], bass: [15, 30], keys: [36, 84] },
    },
    {
      label: '3 notes à la suite',
      grade: G,
      params: { treble: [28, 35], keys: [60, 72], count: 3 },
    },
    {
      label: 'Les touches noires',
      grade: G,
      params: { treble: [28, 34], keys: [59, 72], acc: true },
    },
  ]),

  generate({ rng, params }) {
    const clefs = (['treble', 'bass'] as const).filter((c) => params[c]);
    const clef = rng.pick(clefs);
    const [lo, hi] = params[clef]!;
    const count = params.count ?? 1;
    const notes: Note[] = [];
    while (notes.length < count) {
      const d = rng.int(lo, hi);
      if (notes.length && notes[notes.length - 1]!.d === d) continue;
      let acc = params.acc ? randomAccidental(rng, d) : 0;
      if (params.acc && acc === 0) acc = randomAccidental(rng, d);
      notes.push(note(d, acc));
    }
    const items: StaffItem[] = notes.map((n) => ({ note: n }));
    return {
      widget: 'piano',
      instruction:
        count > 1
          ? `JOUE ces ${count} notes au piano, dans l’ordre.`
          : 'TOUCHE la touche du piano qui joue cette note.',
      picture: staff(clef, items),
      from: params.keys[0],
      to: params.keys[1],
      count,
      ...(params.labels ? { labels: true } : {}),
      data: { clef, notes },
    };
  },

  solve: (q) => ({ keys: q.data.notes.map(midiOf) }),

  explain(q) {
    const names = q.data.notes.map(noteName).join(', ');
    return q.data.notes.length > 1
      ? `Les notes étaient : ${names}.`
      : `C’était un ${names}. Le do est juste à gauche des 2 touches noires : compte à partir de lui.`;
  },

  invariants(q) {
    return q.data.notes.every((n) => midiOf(n) >= q.from && midiOf(n) <= q.to)
      ? undefined
      : 'touche hors du clavier';
  },
});
