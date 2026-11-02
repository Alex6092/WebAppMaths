import { beatsText, defineLevels, definePlugin, figureName, itemBeats } from '@app/core';
import { MUSIC_GRADE as G, staff } from '../../lib/notes';
import { fillBeats, groupBeats, GROUPS, type Group } from '../../lib/rythme';

// « Combien de temps ? » : additionner la durée des notes et des silences.

interface Params {
  pool: string[];
  /** Nombre de groupes à additionner. */
  groups: [number, number];
  /** Compter les mesures : chaque mesure dure ce nombre de temps (3 ou 4). */
  measures?: number[];
}
interface Data {
  groups: Group[];
  answer: number;
  /** Les temps d'une mesure, quand on compte les mesures. */
  time?: number;
}

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'musique.rythme.combien-de-temps',
  version: 1,
  title: 'Combien de temps ?',
  description: 'Additionne la durée des notes et des silences.',
  icon: '⏱️',
  notions: ['musique.rythme.durees'],
  expectedLevel: 3,
  followsGrade: false,
  minVariety: 3,
  levels: defineLevels<Params>([
    {
      label: 'Une note',
      grade: G,
      params: { pool: ['ronde', 'blanche', 'noire'], groups: [1, 1] },
    },
    {
      label: 'Deux notes',
      grade: G,
      params: { pool: ['ronde', 'blanche', 'noire'], groups: [2, 2] },
    },
    {
      label: '3 ou 4 notes',
      grade: G,
      params: { pool: ['blanche', 'noire', 'croches'], groups: [3, 4] },
    },
    {
      label: 'Avec des silences',
      grade: G,
      params: { pool: ['blanche', 'noire', 'croches', 'soupir', 'demiPause'], groups: [3, 4] },
    },
    {
      label: 'Avec des notes pointées',
      grade: G,
      params: {
        pool: ['blanchePointee', 'noirePointeeCroche', 'noire', 'blanche'],
        groups: [2, 3],
      },
    },
    {
      label: 'Combien de mesures ?',
      grade: G,
      params: {
        pool: ['blanche', 'noire', 'croches', 'blanchePointee'],
        groups: [2, 4],
        measures: [3, 4],
      },
    },
  ]),

  generate({ rng, params }) {
    const pool = params.pool.map((name) => GROUPS[name]!);
    if (params.measures) {
      const time = rng.pick(params.measures);
      const count = rng.int(params.groups[0], params.groups[1]);
      const groups = Array.from({ length: count }, () => fillBeats(rng, pool, time)).flat();
      return {
        widget: 'number-input',
        instruction: `Chaque mesure compte ${time} temps. COMPTE les temps de ce rythme.`,
        picture: staff('rhythm', groups.flat()),
        prompt: `Cela fait {?} mesures de ${time} temps.`,
        maxLength: 1,
        data: { groups, answer: count, time },
      };
    }
    const groups = Array.from({ length: rng.int(params.groups[0], params.groups[1]) }, () =>
      rng.pick(pool),
    );
    const answer = groups.reduce((sum, g) => sum + groupBeats(g), 0);
    return {
      widget: 'number-input',
      instruction:
        groups.length === 1
          ? 'Combien de temps dure cette note ?'
          : 'Combien de temps dure ce rythme ?',
      picture: staff('rhythm', groups.flat()),
      prompt: 'Cela dure {?} temps.',
      maxLength: 2,
      data: { groups, answer },
    };
  },

  solve: (q) => ({ value: String(q.data.answer) }),

  explain(q) {
    const parts = q.data.groups
      .flat()
      .map((item) => `${figureName(item)} (${beatsText(itemBeats(item))})`);
    const total = q.data.groups.reduce((sum, g) => sum + groupBeats(g), 0);
    if (q.data.time)
      return `En tout, cela fait ${total} temps : ${q.data.answer} mesures de ${q.data.time} temps.`;
    return `${parts.join(' + ')} = ${beatsText(total)}.`;
  },
});
