import {
  comparePositions,
  defineLevels,
  definePlugin,
  fromPosition,
  MIDDLE_C,
  note,
  noteName,
  staffPosition,
  stepOf,
  STEP_NAMES,
  type Clef,
} from '@app/core';
import { between, CLEF_HINT, melody, MUSIC_GRADE as G, placeText, tones } from '../../lib/notes';

// « POSE un sol sur la portée » : l'enfant touche la ligne ou l'interligne de la note.

type Mode = 'name' | 'register' | 'sequence' | 'dictation';
interface Params {
  mode: Mode;
  /** Plages de notes possibles dans chaque clé (une clé tirée au hasard). */
  treble?: [number, number];
  bass?: [number, number];
}
interface Data {
  clef: Clef;
  /** Les notes à poser (rangs diatoniques). */
  targets: number[];
  /** Faux : n'importe quel sol de la portée convient. */
  exact: boolean;
}

/** Les places qu'on peut toucher : la plage, plus une marche de chaque côté. */
const span = (clef: Clef, [lo, hi]: [number, number]) => ({
  min: staffPosition(lo, clef) - 1,
  max: staffPosition(hi, clef) + 1,
});

export default definePlugin<'staff-place', Params, Data>('staff-place', {
  id: 'musique.lecture.place-note',
  version: 1,
  title: 'Place la note',
  description: 'Touche la ligne ou l’interligne où s’écrit la note.',
  icon: '✏️',
  notions: ['musique.lecture.placer'],
  expectedLevel: 2,
  minVariety: 5,
  levels: defineLevels<Params>([
    { label: 'Clé de sol', grade: G, params: { mode: 'name', treble: [30, 38] } },
    { label: 'Clé de fa', grade: G, params: { mode: 'name', bass: [18, 26] } },
    {
      label: 'Avec les lignes en plus',
      grade: G,
      params: { mode: 'name', treble: [27, 41], bass: [15, 29] },
    },
    {
      label: 'Grave ou aigu ?',
      grade: G,
      params: { mode: 'register', treble: [28, 41], bass: [15, 28] },
    },
    { label: '3 notes', grade: G, params: { mode: 'sequence', treble: [30, 38], bass: [18, 26] } },
    {
      label: 'Écris la mélodie entendue',
      grade: G,
      params: { mode: 'dictation', treble: [28, 36] },
    },
  ]),

  generate({ rng, params }) {
    const clefs = (['treble', 'bass'] as const).filter((c) => params[c]);
    const clef = rng.pick(clefs);
    const range = params[clef]!;
    const { min, max } = span(clef, range);
    const base = { widget: 'staff-place' as const, clef, min, max };

    if (params.mode === 'dictation') {
      const [first, ...targets] = melody(rng, 3, range[0], range[1], 2);
      return {
        ...base,
        instruction: 'ÉCOUTE la mélodie : la 1re note est écrite. POSE les 2 notes suivantes.',
        prompt: `Après le ${noteName(note(first!))}…`,
        count: 2,
        given: [staffPosition(first!, clef)],
        tones: tones([first!, ...targets].map((d) => note(d))),
        data: { clef, targets, exact: true },
      };
    }
    if (params.mode === 'sequence') {
      const targets = melody(rng, 3, range[0], range[1], 3);
      return {
        ...base,
        instruction: 'POSE ces 3 notes sur la portée, de gauche à droite.',
        prompt: targets.map((d) => noteName(note(d))).join(' – '),
        count: 3,
        data: { clef, targets, exact: false },
      };
    }
    if (params.mode === 'register') {
      // Une note qui revient deux fois dans la plage : il faut dire laquelle.
      const notes = between(range[0], range[1]);
      const twice = notes.filter((d) => notes.includes(d + 7) || notes.includes(d - 7));
      const target = rng.pick(twice);
      const word =
        target === MIDDLE_C ? 'du milieu' : notes.includes(target + 7) ? 'grave' : 'aigu';
      return {
        ...base,
        instruction: 'POSE la note sur la portée.',
        prompt: `le ${noteName(note(target))} ${word}`,
        count: 1,
        data: { clef, targets: [target], exact: true },
      };
    }
    const target = rng.int(range[0], range[1]);
    return {
      ...base,
      instruction: 'POSE la note sur la portée.',
      prompt: `un ${noteName(note(target))}`,
      count: 1,
      data: { clef, targets: [target], exact: false },
    };
  },

  solve: (q) => ({ positions: q.data.targets.map((d) => staffPosition(d, q.data.clef)) }),

  check(q, answer) {
    const { clef, targets, exact } = q.data;
    return comparePositions(q.count, answer.positions, (p, i) => {
      const d = fromPosition(p, clef);
      return exact ? d === targets[i] : stepOf(d) === stepOf(targets[i]!);
    });
  },

  explain(q) {
    const { clef, targets } = q.data;
    const d = targets[0]!;
    return `Le ${STEP_NAMES[stepOf(d)]} s’écrit ${placeText(d, q.data.clef)}. ${CLEF_HINT[clef]}`;
  },

  invariants(q) {
    const positions = q.data.targets.map((d) => staffPosition(d, q.data.clef));
    return positions.every((p) => p >= q.min && p <= q.max) ? undefined : 'note hors de la portée';
  },
});
