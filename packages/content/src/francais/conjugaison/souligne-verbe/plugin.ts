import { defineLevels, definePlugin } from '@app/core';
import { MOMENTS, type Moment, type VerbKind } from '../../lib/conjugaison';
import { RED_PEN } from '../../lib/couleurs';
import { buildSentence, type SentenceOptions } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// CONJ 1, exercice 3 : « SOULIGNE le verbe conjugué dans chaque phrase. »

interface Params {
  kinds: VerbKind[];
  subjects: SentenceOptions['subjects'];
  moments: Moment[];
  indicator: SentenceOptions['indicator'];
}

interface Data {
  infinitive: string;
  verbIndex: number;
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.conjugaison.souligne-verbe',
  version: 1,
  title: 'Souligne le verbe conjugué',
  description: 'Trouve le verbe conjugué dans la phrase.',
  icon: '✍️',
  notions: ['francais.conjugaison.verbe-conjugue-phrase'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    {
      label: 'Après je, tu, nous…',
      grade: 'CE1',
      params: {
        kinds: ['regular'],
        subjects: ['pronoun'],
        moments: ['present'],
        indicator: 'none',
      },
    },
    {
      label: 'Après un prénom ou un nom',
      grade: 'CE1',
      params: {
        kinds: ['regular', 'spelling', 'group2'],
        subjects: ['name', 'group'],
        moments: ['present'],
        indicator: 'none',
      },
    },
    {
      label: 'Au passé, au présent ou au futur',
      grade: 'CE1',
      params: {
        kinds: ['regular', 'spelling', 'group2', 'irregular'],
        subjects: ['pronoun', 'name', 'group'],
        moments: [...MOMENTS],
        indicator: 'any',
      },
    },
  ]),

  generate({ rng, params }) {
    const s = buildSentence(rng, {
      verbs: verbsOfKinds(params.kinds),
      moment: rng.pick(params.moments),
      indicator: params.indicator,
      subjects: params.subjects,
    });
    return {
      widget: 'word-select',
      instruction: 'SOULIGNE le verbe conjugué.',
      layout: 'sentence',
      mark: 'underline',
      tokens: s.tokens,
      colors: RED_PEN,
      data: { infinitive: s.verb.inf, verbIndex: s.roles.indexOf('verb') },
    };
  },

  solve: (q) => ({ picks: q.tokens.map((_, i) => (i === q.data.verbIndex ? 'x' : null)) }),

  explain(q) {
    const verb = q.tokens[q.data.verbIndex]!.text;
    return `Le verbe conjugué est « ${verb} » (infinitif : ${q.data.infinitive}). Il change si on dit « hier » ou « demain ».`;
  },

  invariants: (q) => (q.data.verbIndex < 0 ? 'pas de verbe' : undefined),

  signature: (q) => q.tokens.map((t) => t.text).join(' '),
});
