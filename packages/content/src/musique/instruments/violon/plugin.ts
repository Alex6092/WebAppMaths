import {
  defineLevels,
  definePlugin,
  fingering,
  note,
  noteName,
  VIOLIN_STRINGS,
  type Fingering,
  type McqChoice,
  type Note,
} from '@app/core';
import { between, MUSIC_GRADE as G, staff } from '../../lib/notes';

// Le violon en 1re position : sur quelle corde, avec quel doigt se joue la note écrite ?

type Ask = 'string' | 'finger' | 'both' | 'fourth';
interface Params {
  ask: Ask;
  /** Les notes possibles (rangs diatoniques). */
  notes: number[];
  /** Des dièses (fa♯, do♯, sol♯). */
  sharps?: boolean;
}
interface Data {
  note: Note;
  answer: string;
  /** La corde, quand la consigne la donne (« sur la corde de la »). */
  string?: number;
}

const stringLabel = (s: number) => `corde de ${VIOLIN_STRINGS[s]!.name}`;
const fingerLabel = (f: number) => (f === 0 ? 'à vide' : f === 1 ? '1er doigt' : `${f}e doigt`);
const bothLabel = (f: Fingering) => `${stringLabel(f.string)}, ${fingerLabel(f.finger)}`;
const OPEN = VIOLIN_STRINGS.map((s) => s.open);
const SHARPS = [31, 35, 38, 39]; // fa♯, do♯, fa♯ aigu, sol♯

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.instruments.violon',
  version: 1,
  title: 'Sur quelle corde ?',
  description: 'Lis la note et trouve la corde et le doigt du violon.',
  icon: '🎻',
  notions: ['musique.instruments.violon'],
  expectedLevel: 3,
  minVariety: 4,
  levels: defineLevels<Params>([
    { label: 'Les cordes à vide', grade: G, params: { ask: 'string', notes: OPEN } },
    { label: 'Cordes de la et de mi', grade: G, params: { ask: 'string', notes: between(33, 41) } },
    { label: 'Les quatre cordes', grade: G, params: { ask: 'string', notes: between(25, 41) } },
    { label: 'Quel doigt ?', grade: G, params: { ask: 'finger', notes: between(25, 41) } },
    { label: 'La corde et le doigt', grade: G, params: { ask: 'both', notes: between(25, 41) } },
    { label: 'Le 4e doigt', grade: G, params: { ask: 'fourth', notes: between(25, 41) } },
    { label: 'Avec les dièses', grade: G, params: { ask: 'both', notes: SHARPS, sharps: true } },
  ]),

  generate({ rng, params }) {
    // Le 4e doigt : la moitié du temps, une note qui se joue aussi à vide.
    const fourth = params.ask === 'fourth' && rng.chance(0.5);
    const d = fourth ? rng.pick([29, 33, 37]) : rng.pick(params.notes);
    const n = note(d, params.sharps ? 1 : 0);
    const f = fingering(d, fourth)!;
    const picture = staff('treble', [{ note: n }]);
    const base = { widget: 'mcq' as const, picture, multiple: false };

    if (params.ask === 'string' || fourth) {
      return {
        ...base,
        instruction: fourth
          ? `JOUE ce ${noteName(n)} avec le 4e doigt : sur quelle corde ?`
          : 'Sur quelle CORDE du violon se joue cette note ?',
        choices: VIOLIN_STRINGS.map((_, s) => ({ id: stringLabel(s), label: stringLabel(s) })),
        layout: 'grid',
        data: { note: n, answer: stringLabel(f.string) },
      };
    }
    if (params.ask === 'finger') {
      return {
        ...base,
        instruction: `Sur la ${stringLabel(f.string)}, avec quel DOIGT joue-t-on cette note ?`,
        choices: [0, 1, 2, 3, 4].map((x) => ({ id: fingerLabel(x), label: fingerLabel(x) })),
        layout: 'row',
        data: { note: n, answer: fingerLabel(f.finger), string: f.string },
      };
    }
    // La corde et le doigt : la bonne réponse et trois autres, jamais une autre façon juste.
    const right = bothLabel(f);
    const other = fingering(d, true);
    const forbidden = new Set([right, ...(other ? [bothLabel(other)] : [])]);
    const pool: string[] = [];
    for (let s = 0; s < 4; s++)
      for (let x = 0; x <= 4; x++) {
        const label = bothLabel({ string: s, finger: x });
        if (!forbidden.has(label) && (s === f.string || x === f.finger)) pool.push(label);
      }
    const choices: McqChoice[] = rng
      .shuffle([right, ...rng.sample(pool, 3)])
      .map((label) => ({ id: label, label }));
    return {
      ...base,
      instruction: 'Sur quelle CORDE et avec quel DOIGT joue-t-on cette note ?',
      choices,
      layout: 'list',
      data: { note: n, answer: right },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const f = fingering(q.data.note.d)!;
    const string = VIOLIN_STRINGS[f.string]!;
    const climb = [noteName(note(string.open))];
    for (let i = 1; i <= f.finger; i++) climb.push(noteName(note(string.open + i)));
    return f.finger === 0
      ? `Le ${noteName(q.data.note)} est la ${stringLabel(f.string)} à vide.`
      : `Sur la ${stringLabel(f.string)} : ${climb.join(', ')}. Le ${noteName(q.data.note)} se joue avec le ${fingerLabel(f.finger)}.`;
  },
});
