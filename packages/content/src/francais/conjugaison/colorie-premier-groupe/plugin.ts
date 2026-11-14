import { defineLevels, definePlugin } from '@app/core';
import { conjugate, PRONOUNS, withSubject, type Person } from '../../lib/conjugaison';
import { PINK } from '../../lib/couleurs';
import { OTHER_VERBS, PREMIER_GROUPE_NOTION, REGULAR_ER, SOFT_ER } from '../../lib/premier-groupe';

// CONJ 3 : « Les verbes du premier groupe sont les verbes qui se terminent par -ER à l'infinitif. »

interface Params {
  /** Des verbes conjugués : il faut d'abord retrouver l'infinitif. */
  conjugated: boolean;
  count: number;
}

interface Data {
  infinitives: string[];
  right: boolean[];
}

const GROUP1 = [...REGULAR_ER, ...SOFT_ER.map((v) => v.inf)];
// « il ouvre » ressemble trop à un verbe en -er pour un CE1.
const OTHERS_CONJUGATED = OTHER_VERBS.filter((inf) => inf !== 'ouvrir');

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.conjugaison.colorie-premier-groupe',
  version: 1,
  title: 'Les verbes du 1er groupe',
  description: 'Colorie les verbes qui finissent par -er à l’infinitif.',
  icon: '🖍️',
  notions: [PREMIER_GROUPE_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Des infinitifs', grade: 'CE1', params: { conjugated: false, count: 10 } },
    { label: 'Des verbes conjugués', grade: 'CE1', params: { conjugated: true, count: 8 } },
  ]),

  generate({ rng, params }) {
    const right = rng.int(Math.floor(params.count / 2) - 1, Math.ceil(params.count / 2) + 1);
    const verbs = rng.shuffle([
      ...rng.sample(GROUP1, right).map((inf) => ({ inf, right: true })),
      ...rng
        .sample(params.conjugated ? OTHERS_CONJUGATED : OTHER_VERBS, params.count - right)
        .map((inf) => ({ inf, right: false })),
    ]);
    const tokens = verbs.map(({ inf }) => {
      if (!params.conjugated) return { text: inf };
      const person = rng.int(0, 5) as Person;
      const pronoun = rng.pick(PRONOUNS[person].filter((p) => p !== 'on'));
      return { text: withSubject(pronoun, conjugate(inf, 'present', person)).replace("'", '’') };
    });
    return {
      widget: 'word-select',
      instruction: params.conjugated
        ? 'COLORIE les verbes du 1er groupe. Cherche d’abord l’infinitif : « il faut… ».'
        : 'COLORIE les verbes du 1er groupe.',
      layout: 'grid',
      mark: 'color',
      tokens,
      colors: PINK,
      data: { infinitives: verbs.map((v) => v.inf), right: verbs.map((v) => v.right) },
    };
  },

  solve: (q) => ({ picks: q.data.right.map((r) => (r ? PINK[0]!.id : null)) }),

  explain(q) {
    const found = q.data.infinitives.filter((_, i) => q.data.right[i]);
    return `Les verbes du 1er groupe finissent par -er à l’infinitif : ${found.join(', ')}.`;
  },

  invariants: (q) =>
    q.data.right.some(Boolean) && !q.data.right.every(Boolean) ? undefined : 'pas de mélange',

  signature: (q) => q.tokens.map((t) => t.text).join(' '),
});
