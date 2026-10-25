import { defineLevels, definePlugin } from '@app/core';
import { MOMENTS, PERSONS, type Tense, type VerbKind } from '../../lib/conjugaison';
import { buildSentence, withPronoun } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// CONJ 1, exercices 4 et 5 : « DONNE l'infinitif des verbes conjugués. »

interface Params {
  kinds: VerbKind[];
  tenses: Tense[];
  /** Le verbe est dans une phrase (il faut d'abord le trouver). */
  sentence?: boolean;
}

interface Data {
  infinitive: string;
  form: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.donne-infinitif',
  version: 1,
  title: 'Donne l’infinitif',
  description: 'Écris le verbe à l’infinitif : nous plongeons → plonger.',
  icon: '🔤',
  notions: ['francais.conjugaison.donner-infinitif'],
  expectedLevel: 4,
  levels: defineLevels<Params>([
    {
      label: 'Verbes en -er au présent',
      grade: 'CE1',
      params: { kinds: ['regular'], tenses: ['present'] },
    },
    {
      label: 'Verbes en -er qui changent (ç, ge, è…)',
      grade: 'CE1',
      params: { kinds: ['spelling'], tenses: ['present'] },
    },
    {
      label: 'Au passé et au futur',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling'], tenses: ['imparfait', 'futur'] },
    },
    {
      label: 'Dans une phrase',
      grade: 'CE1',
      params: { kinds: ['regular', 'spelling', 'group2'], tenses: [], sentence: true },
    },
    {
      label: 'Verbes irréguliers (faire, prendre…)',
      grade: 'CE1',
      params: { kinds: ['irregular', 'group2'], tenses: ['present', 'futur'] },
    },
  ]),

  generate({ rng, params }) {
    const verbs = verbsOfKinds(params.kinds);
    if (params.sentence) {
      const s = buildSentence(rng, { verbs, moment: rng.pick(MOMENTS), indicator: 'any' });
      return {
        widget: 'fill-blank',
        instruction: 'TROUVE le verbe conjugué et DONNE son infinitif.',
        prompt: `${s.text}\n→ {0}`,
        blanks: [{ kind: 'text' }],
        data: { infinitive: s.verb.inf, form: s.tokens[s.roles.indexOf('verb')]!.text },
      };
    }
    const verb = rng.pick(verbs);
    const form = withPronoun(rng, verb.inf, rng.pick(params.tenses), rng.pick(PERSONS));
    return {
      widget: 'fill-blank',
      instruction: 'DONNE l’infinitif du verbe conjugué.',
      prompt: `${form} → {0}`,
      blanks: [{ kind: 'text' }],
      data: { infinitive: verb.inf, form },
    };
  },

  solve: (q) => ({ values: [q.data.infinitive] }),

  explain: (q) =>
    `On dit « il faut ${q.data.infinitive} » : l’infinitif de « ${q.data.form} » est ${q.data.infinitive}.`,

  signature: (q) => q.prompt,
});
