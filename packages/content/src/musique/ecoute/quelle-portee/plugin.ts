import {
  defineLevels,
  definePlugin,
  midiOf,
  note,
  noteName,
  noteSymbol,
  STEP_NAMES,
  stepOf,
  type Clef,
  type Duration,
  type McqChoice,
  type StaffItem,
} from '@app/core';
import { between, melody, MUSIC_GRADE as G, staff } from '../../lib/notes';

// « Quelle portée as-tu entendue ? » : une petite mélodie, et les portées entre lesquelles choisir.

interface Params {
  clef: Clef;
  count: number;
  /** Nombre de portées à choisir. */
  choices: number;
  /** Les autres portées ne changent que d'une note (plus difficile). */
  near?: boolean;
  /** Avec un rythme : des noires et des blanches. */
  rhythm?: boolean;
  /** La 1re note est écrite : trouver la 2e à l'oreille. */
  next?: boolean;
}
interface Data {
  notes: number[];
  durs: Duration[];
  answer: string;
}

const RANGE: Record<Clef, [number, number]> = { treble: [28, 36], bass: [18, 26] };
const key = (notes: number[], durs: Duration[]) => notes.map((d, i) => `${d}${durs[i]}`).join();

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.ecoute.quelle-portee',
  version: 1,
  title: 'Quelle portée as-tu entendue ?',
  description: 'Écoute la mélodie et retrouve-la sur la portée.',
  icon: '🎶',
  notions: ['musique.ecoute.dictee'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 5,
  levels: defineLevels<Params>([
    { label: '3 notes, 2 portées', grade: G, params: { clef: 'treble', count: 3, choices: 2 } },
    { label: '3 notes, 3 portées', grade: G, params: { clef: 'treble', count: 3, choices: 3 } },
    { label: '4 notes', grade: G, params: { clef: 'treble', count: 4, choices: 3 } },
    {
      label: 'Une seule note change',
      grade: G,
      params: { clef: 'treble', count: 4, choices: 3, near: true },
    },
    { label: 'En clé de fa', grade: G, params: { clef: 'bass', count: 4, choices: 3, near: true } },
    {
      label: 'Avec le rythme',
      grade: G,
      params: { clef: 'treble', count: 4, choices: 3, near: true, rhythm: true },
    },
    {
      label: 'Trouve la note suivante',
      grade: G,
      params: { clef: 'treble', count: 2, choices: 5, next: true },
    },
  ]),

  generate({ rng, params }) {
    const [lo, hi] = RANGE[params.clef];
    if (params.next) {
      const [first, second] = melody(rng, 2, lo + 1, hi - 1, 3) as [number, number];
      const options = between(first - 3, first + 3).filter((d) => d !== first);
      const picks = rng.sample(
        options.filter((d) => d !== second),
        params.choices - 1,
      );
      const names = [second, ...picks].sort((a, b) => a - b);
      return {
        widget: 'mcq',
        instruction: 'ÉCOUTE les deux notes. La 1re est écrite : COCHE le nom de la 2e.',
        tones: [first, second].map((d) => ({ midi: midiOf(note(d)), beats: 1.5 })),
        picture: staff(params.clef, [{ note: note(first) }, { ask: true }]),
        choices: names.map((d) => ({ id: String(d), label: noteName(note(d)) })),
        multiple: false,
        layout: 'row',
        data: { notes: [first, second], durs: ['w', 'w'], answer: String(second) },
      };
    }

    const durations = (): Duration[] =>
      Array.from({ length: params.count }, () =>
        params.rhythm ? rng.pick(['q', 'h'] as const) : 'q',
      );
    const notes = melody(rng, params.count, lo, hi, 2);
    const durs = durations();
    const melodies: { notes: number[]; durs: Duration[] }[] = [{ notes, durs }];
    const seen = new Set([key(notes, durs)]);
    while (melodies.length < params.choices) {
      let other: { notes: number[]; durs: Duration[] };
      if (params.rhythm && rng.chance(0.5)) {
        other = { notes, durs: durations() };
      } else if (params.near) {
        const k = rng.int(1, params.count - 1);
        other = {
          notes: notes.map((d, i) =>
            i === k ? Math.min(hi, Math.max(lo, d + rng.pick([-2, -1, 1, 2]))) : d,
          ),
          durs,
        };
      } else {
        other = { notes: melody(rng, params.count, lo, hi, 2), durs: durations() };
      }
      const k = key(other.notes, other.durs);
      if (seen.has(k)) continue;
      seen.add(k);
      melodies.push(other);
    }
    const order = rng.shuffle(melodies.map((_, i) => i));
    const letters = 'ABCDE';
    const choices: McqChoice[] = order.map((m, i) => {
      const items: StaffItem[] = melodies[m]!.notes.map((d, j) => ({
        note: note(d),
        dur: melodies[m]!.durs[j],
      }));
      return { id: letters[i]!, label: letters[i]!, picture: staff(params.clef, items) };
    });
    return {
      widget: 'mcq',
      instruction: 'ÉCOUTE la mélodie et COCHE la portée qui la montre.',
      tones: notes.map((d, i) => ({ midi: midiOf(note(d)), beats: durs[i] === 'h' ? 2 : 1 })),
      choices,
      multiple: false,
      layout: 'list',
      data: { notes, durs, answer: letters[order.indexOf(0)]! },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const { notes } = q.data;
    const names = notes.map((d) => noteSymbol(note(d))).join(' – ');
    if (notes.length === 2) {
      const [a, b] = notes as [number, number];
      const way = b > a ? 'monte' : 'descend';
      return `C’était ${names} : la mélodie ${way} de ${Math.abs(b - a)} note${Math.abs(b - a) > 1 ? 's' : ''} jusqu’au ${STEP_NAMES[stepOf(b)]}.`;
    }
    return `C’était ${names}. Réécoute en suivant les notes du doigt. 🎵`;
  },
});
