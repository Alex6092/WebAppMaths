import {
  defineLevels,
  definePlugin,
  figureName,
  totalBeats,
  type McqChoice,
  type StaffItem,
} from '@app/core';
import { MUSIC_GRADE as G, staff } from '../../lib/notes';
import { fillBeats, GROUPS, type Group } from '../../lib/rythme';

// « Complète la mesure » : il manque une figure ; laquelle complète la mesure ?

interface Params {
  times: number[];
  pool: string[];
  /** Les figures qui peuvent manquer (une seule bonne durée parmi elles). */
  missing: StaffItem[];
  /** Trouver, parmi trois mesures, celle qui ne compte pas le bon nombre de temps. */
  wrong?: boolean;
}
interface Data {
  answer: string;
  time: number;
}

const notes = (...durs: StaffItem[]) => durs;

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.rythme.complete-mesure',
  version: 1,
  title: 'Complète la mesure',
  description: 'Trouve la note qui manque pour faire le bon nombre de temps.',
  icon: '🧩',
  notions: ['musique.rythme.durees'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 5,
  levels: defineLevels<Params>([
    {
      label: 'Mesure à 4 temps',
      grade: G,
      params: {
        times: [4],
        pool: ['blanche', 'noire'],
        missing: notes({ dur: 'q' }, { dur: 'h' }, { dur: 'w' }),
      },
    },
    {
      label: 'Avec des silences',
      grade: G,
      params: {
        times: [4],
        pool: ['blanche', 'noire', 'soupir'],
        missing: notes(
          { dur: 'q', rest: true },
          { dur: 'h', rest: true },
          { dur: 'w', rest: true },
        ),
      },
    },
    {
      label: 'Mesures à 2 et à 3 temps',
      grade: G,
      params: {
        times: [2, 3],
        pool: ['blanche', 'noire'],
        missing: notes({ dur: 'q' }, { dur: 'h' }, { dur: 'h', dot: true }),
      },
    },
    {
      label: 'Avec des croches',
      grade: G,
      params: {
        times: [2, 3, 4],
        pool: ['noire', 'croches', 'croche'],
        missing: notes({ dur: 'e' }, { dur: 'q' }, { dur: 'h' }),
      },
    },
    {
      label: 'Avec des notes pointées',
      grade: G,
      params: {
        times: [3, 4],
        pool: ['noire', 'croches', 'croche', 'blanche'],
        missing: notes(
          { dur: 'q', dot: true },
          { dur: 'h', dot: true },
          { dur: 'h' },
          { dur: 'q' },
        ),
      },
    },
    {
      label: 'Trouve la mesure fausse',
      grade: G,
      params: {
        times: [3, 4],
        pool: ['blanche', 'noire', 'croches', 'soupir', 'blanchePointee'],
        missing: [],
        wrong: true,
      },
    },
  ]),

  generate({ rng, params }) {
    const time = rng.pick(params.times);
    const pool = params.pool.map((name) => GROUPS[name]!);

    if (params.wrong) {
      // Deux mesures justes et une qui a un temps de trop ou de moins.
      const good = () => fillBeats(rng, pool, time).flat();
      const bad = fillBeats(rng, pool, time + rng.pick([-1, 1])).flat();
      const measures = [bad, good(), good()];
      const order = rng.shuffle([0, 1, 2]);
      const choices: McqChoice[] = order.map((m, i) => ({
        id: 'ABC'[i]!,
        label: 'ABC'[i]!,
        picture: staff('rhythm', [...measures[m]!, { bar: true }], time),
      }));
      return {
        widget: 'mcq',
        instruction: `Chaque mesure doit compter ${time} temps. COCHE la mesure qui est FAUSSE.`,
        choices,
        multiple: false,
        layout: 'list',
        data: { answer: 'ABC'[order.indexOf(0)]!, time },
      };
    }

    // La figure qui manque doit tenir dans la mesure, avec au moins une figure à côté.
    const fits = params.missing.filter((m) => totalBeats([m]) < time);
    const gap = rng.pick(fits);
    const rest = fillBeats(rng, pool, time - totalBeats([gap])) as Group[];
    const at = rng.int(0, rest.length);
    const items: StaffItem[] = [
      ...rest.slice(0, at).flat(),
      { ask: true },
      ...rest.slice(at).flat(),
      { bar: true },
    ];
    const answer = figureName(gap);
    return {
      widget: 'mcq',
      instruction: `Cette mesure compte ${time} temps. COCHE ce qui manque à la place du « ? ».`,
      picture: staff('rhythm', items, time),
      choices: params.missing.map((m) => ({
        id: figureName(m),
        label: figureName(m),
        picture: staff('rhythm', [m]),
      })),
      multiple: false,
      layout: 'grid',
      data: { answer, time },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  invariants(q) {
    if (q.picture?.kind !== 'staff') return undefined;
    const gap = q.choices.find((c) => c.id === q.data.answer)?.picture;
    const missing = gap?.kind === 'staff' ? totalBeats(gap.items) : 0;
    const total = totalBeats(q.picture.items.filter((i) => !i.ask)) + missing;
    return total === q.data.time
      ? undefined
      : `la mesure fait ${total} temps au lieu de ${q.data.time}`;
  },

  explain(q) {
    if (q.data.answer.length === 1)
      return `La mesure ${q.data.answer} ne fait pas ${q.data.time} temps : compte les temps de chaque note.`;
    return `Il manquait : ${q.data.answer}. Compte les temps des autres notes, puis ce qu’il reste pour arriver à ${q.data.time}.`;
  },
});
