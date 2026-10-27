import { defineLevels, definePlugin } from '@app/core';
import { T_FROM_FEMININE, T_FROM_VERB } from '../../lib/lettre-t';

// Dictée 4, exercice 3 : « RETROUVE le mot dérivé qui se termine par un t muet » (sauter → un saut).

interface Params {
  /** verb : sauter → un saut ; feminine : petite → petit. */
  from: 'verb' | 'feminine';
}

interface Data {
  base: string;
  answer: string;
  from: Params['from'];
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.t-muet',
  version: 1,
  title: 'Le t muet à la fin du mot',
  description: 'Sauter → un saut : un mot de la même famille fait entendre le t.',
  icon: '🤫',
  notions: ['francais.orthographe.lettre-t', 'francais.orthographe.dictee-4'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec le verbe (sauter → un saut)', grade: 'CE1', params: { from: 'verb' } },
    { label: 'Avec le féminin (petite → petit)', grade: 'CE1', params: { from: 'feminine' } },
  ]),

  generate({ rng, params }) {
    const verb = params.from === 'verb';
    const [base, answer] = rng.pick(verb ? T_FROM_VERB : T_FROM_FEMININE);
    return {
      widget: 'fill-blank',
      instruction: verb
        ? 'RETROUVE le nom qui finit par un t muet.'
        : 'ÉCRIS le mot au masculin : il finit par une lettre muette.',
      prompt: verb ? `${base} → un {0}` : `elle est ${base} → il est {0}`,
      blanks: [{ kind: 'text', size: Math.max(6, answer.length + 2) }],
      data: { base, answer, from: params.from },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),

  explain: (q) =>
    q.data.from === 'verb'
      ? `Dans « ${q.data.base} », on entend le t : « un ${q.data.answer} » finit par un t muet.`
      : `Au féminin, « ${q.data.base} », on entend le t : au masculin, « ${q.data.answer} », il est muet.`,

  signature: (q) => q.data.base,
});
