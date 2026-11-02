import {
  defineLevels,
  definePlugin,
  onLine,
  staffPosition,
  stepOf,
  STEP_NAMES,
  type Clef,
  type McqChoice,
} from '@app/core';
import { MUSIC_GRADE as G, placeText, staff, whole } from '../../lib/notes';

// Repérer et comparer : ligne ou interligne, la plus aiguë, l'écart entre deux notes.

type Mode = 'line' | 'higher' | 'count' | 'interval' | 'octave' | 'same';
interface Params {
  mode: Mode;
}
interface Data {
  clef: Clef;
  notes: number[];
  answer: string;
}

const RANGES: Record<Clef, [number, number]> = { treble: [27, 41], bass: [15, 29] };
const INTERVALS = ['seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septième', 'octave'];

const plain = (ids: string[]): McqChoice[] => ids.map((id) => ({ id, label: id }));

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.lecture.reperer',
  version: 1,
  title: 'Comparer deux notes',
  description: 'Ligne ou interligne, grave ou aigu, et l’écart entre deux notes.',
  icon: '🔍',
  notions: ['musique.lecture.reperer'],
  expectedLevel: 3,
  followsGrade: false,
  levels: defineLevels<Params>([
    { label: 'Ligne ou interligne ?', grade: G, params: { mode: 'line' } },
    { label: 'La plus aiguë', grade: G, params: { mode: 'higher' } },
    { label: 'Combien de notes ?', grade: G, params: { mode: 'count' } },
    { label: 'Seconde, tierce, quarte, quinte', grade: G, params: { mode: 'interval' } },
    { label: 'Jusqu’à l’octave', grade: G, params: { mode: 'octave' } },
    { label: 'La même note dans les deux clés', grade: G, params: { mode: 'same' } },
  ]),

  generate({ rng, params }) {
    const clef: Clef = rng.pick(['treble', 'bass']);
    const [lo, hi] = RANGES[clef];

    if (params.mode === 'line') {
      const d = rng.int(lo, hi);
      return {
        widget: 'mcq',
        instruction: 'Cette note est-elle SUR une ligne ou DANS un interligne ?',
        picture: staff(clef, [whole(d)]),
        choices: [
          { id: 'ligne', label: 'sur une ligne' },
          { id: 'interligne', label: 'dans un interligne' },
        ],
        multiple: false,
        layout: 'grid',
        data: { clef, notes: [d], answer: onLine(staffPosition(d, clef)) ? 'ligne' : 'interligne' },
      };
    }

    if (params.mode === 'same') {
      // Une note en clé de sol, une en clé de fa : même nom ou pas ?
      const top = rng.int(30, 38);
      const same = rng.chance(0.5);
      const bottom = same
        ? rng.pick([top - 7, top - 14].filter((d) => d >= 18 && d <= 28))
        : rng.pick([18, 19, 20, 21, 22, 23, 24, 25, 26].filter((d) => stepOf(d) !== stepOf(top)));
      return {
        widget: 'mcq',
        instruction: 'Ces deux notes ont-elles le MÊME NOM ?',
        picture: staff('grand', [whole(top), { ...whole(bottom), low: true }]),
        choices: plain(['oui', 'non']),
        multiple: false,
        layout: 'grid',
        data: { clef: 'treble', notes: [top, bottom], answer: same ? 'oui' : 'non' },
      };
    }

    const maxGap = params.mode === 'octave' ? 7 : params.mode === 'higher' ? 6 : 4;
    const gap = rng.int(1, maxGap) * (rng.chance(0.5) ? 1 : -1);
    const first = rng.int(Math.max(lo, lo - gap), Math.min(hi, hi - gap));
    const notes = [first, first + gap];
    const picture = staff(
      clef,
      notes.map((d) => whole(d)),
    );
    const size = Math.abs(gap);

    if (params.mode === 'higher') {
      return {
        widget: 'mcq',
        instruction: 'Quelle note est la plus AIGUË ?',
        picture,
        choices: [
          { id: '1', label: 'la 1re note' },
          { id: '2', label: 'la 2e note' },
        ],
        multiple: false,
        layout: 'grid',
        data: { clef, notes, answer: gap > 0 ? '2' : '1' },
      };
    }
    if (params.mode === 'count') {
      return {
        widget: 'mcq',
        instruction: 'De la 1re note à la 2e, combien y a-t-il de notes, en comptant les deux ?',
        picture,
        choices: plain(['2', '3', '4', '5']),
        multiple: false,
        layout: 'row',
        data: { clef, notes, answer: String(size + 1) },
      };
    }
    const names = INTERVALS.slice(0, maxGap);
    return {
      widget: 'mcq',
      instruction: 'COCHE le nom de l’écart entre ces deux notes.',
      picture,
      choices: plain(names),
      multiple: false,
      layout: 'grid',
      data: { clef, notes, answer: INTERVALS[size - 1]! },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const { clef, notes, answer } = q.data;
    const name = (d: number) => STEP_NAMES[stepOf(d)];
    if (notes.length === 1)
      return `La note (un ${name(notes[0]!)}) est ${placeText(notes[0]!, clef)}.`;
    const [a, b] = notes as [number, number];
    if (answer === 'oui' || answer === 'non')
      return `En haut, c’est un ${name(a)} (clé de sol) ; en bas, un ${name(b)} (clé de fa).`;
    const lowToHigh = Array.from({ length: Math.abs(b - a) + 1 }, (_, i) =>
      name(Math.min(a, b) + i),
    );
    if (answer === '1' || answer === '2')
      return `La note la plus haute sur la portée est la plus aiguë : ici le ${name(Math.max(a, b))}.`;
    return `${name(a)} → ${name(b)} : ${lowToHigh.join(', ')}, cela fait ${lowToHigh.length} notes (${INTERVALS[lowToHigh.length - 2]}).`;
  },
});
