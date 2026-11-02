import {
  defineLevels,
  definePlugin,
  note,
  noteName,
  noteSymbol,
  type Clef,
  type LevelDef,
  type McqChoice,
  type Note,
  type StaffItem,
} from '@app/core';
import {
  accidentalChoices,
  between,
  CLEF_HINT,
  nameChoices,
  placeText,
  randomAccidental,
  staff,
} from './notes';

/**
 * « COCHE le nom de la note » : une portée, une note (ou une suite de notes à lire vite), et ses
 * noms à cocher. Sert à la clé de sol, à la clé de fa et aux deux clés mélangées.
 */
export interface ReadingParams {
  /** Plages de notes (rangs diatoniques) dans chaque clé. */
  treble?: [number, number];
  bass?: [number, number];
  /** Les deux portées du piano (le grand système). */
  grand?: boolean;
  /** Nombre de notes à lire d'affilée (1 par défaut). */
  count?: number;
  /** Des dièses et des bémols. */
  acc?: boolean;
}

interface Data {
  notes: Note[];
  clefs: Clef[];
  answer: string;
}

export function readingPlugin(options: {
  id: string;
  notion: string;
  title: string;
  description: string;
  icon: string;
  levels: LevelDef<ReadingParams>[];
  expectedLevel: number;
}) {
  return definePlugin<'mcq', ReadingParams, Data>('mcq', {
    id: options.id,
    version: 1,
    title: options.title,
    description: options.description,
    icon: options.icon,
    notions: [options.notion],
    expectedLevel: options.expectedLevel,
    minVariety: 3,
    levels: defineLevels<ReadingParams>(options.levels),

    generate({ rng, params }) {
      const available: Clef[] = [];
      if (params.treble) available.push('treble');
      if (params.bass) available.push('bass');
      const count = params.count ?? 1;
      const oneClef = rng.pick(available);
      const clefs = Array.from({ length: count }, () =>
        params.grand ? rng.pick(available) : oneClef,
      );
      const drawn: number[] = [];
      const notes = clefs.map((clef, i): Note => {
        const [lo, hi] = params[clef]!;
        let d = rng.int(lo, hi);
        // Deux notes pareilles à la suite ne s'apprennent pas : on change la deuxième.
        if (i > 0 && d === drawn[i - 1]) d = d === hi ? d - 1 : d + 1;
        drawn.push(d);
        let acc = params.acc ? randomAccidental(rng, d) : 0;
        if (params.acc && acc === 0 && rng.chance(0.7)) acc = randomAccidental(rng, d);
        return note(d, acc);
      });
      const items: StaffItem[] = notes.map((n, i) => ({
        note: n,
        ...(params.grand && clefs[i] === 'bass' ? { low: true } : {}),
      }));
      const picture = staff(params.grand ? 'grand' : oneClef, items);

      if (count > 1) {
        // Une suite de notes : la bonne, et trois suites où une seule note change.
        const right = notes.map(noteSymbol).join(' – ');
        const labels = new Set([right]);
        while (labels.size < 4) {
          const k = rng.int(0, count - 1);
          const changed = notes.map((n, i) => (i === k ? note(n.d + rng.pick([-2, -1, 1, 2])) : n));
          labels.add(changed.map(noteSymbol).join(' – '));
        }
        const choices: McqChoice[] = rng
          .shuffle([...labels])
          .map((label, i) => ({ id: 'abcd'[i]!, label }));
        return {
          widget: 'mcq',
          instruction: `LIS les ${count} notes, de gauche à droite, et COCHE leurs noms.`,
          picture,
          choices,
          multiple: false,
          layout: 'list',
          data: { notes, clefs, answer: choices.find((c) => c.label === right)!.id },
        };
      }

      const n = notes[0]!;
      const choices = params.acc
        ? accidentalChoices(n)
        : params.grand
          ? nameChoices(between(0, 6))
          : nameChoices(between(...params[oneClef]!));
      return {
        widget: 'mcq',
        instruction: 'COCHE le nom de la note.',
        picture,
        choices,
        multiple: false,
        layout: choices.length > 4 ? 'row' : 'grid',
        data: { notes, clefs, answer: noteName(n) },
      };
    },

    solve: (q) => ({ selected: [q.data.answer] }),

    explain(q) {
      const { notes, clefs } = q.data;
      if (notes.length > 1) return `Les notes sont : ${notes.map(noteSymbol).join(' – ')}.`;
      const n = notes[0]!;
      const clef = clefs[0]!;
      return `C’est un ${noteName(n)} : il est ${placeText(n.d, clef)}. ${CLEF_HINT[clef]}`;
    },

    invariants(q, { params }) {
      for (const [i, n] of q.data.notes.entries()) {
        const range = params[q.data.clefs[i]!];
        if (!range || n.d < range[0] - 1 || n.d > range[1] + 1)
          return `note ${n.d} hors de la plage`;
      }
      return undefined;
    },
  });
}
