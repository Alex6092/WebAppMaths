import { defineLevels, definePlugin } from '@app/core';
import { D_FEMININE, D_FROM_FAMILY } from '../../lib/lettre-d';

// Dictée 5, exercice 2 : « ÉCRIS ces adjectifs au féminin » (froid → froide), puis l'inverse, et
// le d muet retrouvé grâce à un mot de la même famille (bavarder → bavard).

interface Params {
  /** feminine : froid → froide ; masculine : grande → grand ; family : bavarder → bavard. */
  ask: 'feminine' | 'masculine' | 'family';
}

interface Data {
  base: string;
  answer: string;
  ask: Params['ask'];
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.d-muet',
  version: 1,
  title: 'Le d muet à la fin du mot',
  description: 'Froid → froide : au féminin, on entend le d.',
  icon: '🤫',
  notions: ['francais.orthographe.lettre-d', 'francais.orthographe.dictee-5'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Au féminin (froid → froide)', grade: 'CE1', params: { ask: 'feminine' } },
    { label: 'Au masculin (grande → grand)', grade: 'CE1', params: { ask: 'masculine' } },
    { label: 'Avec la famille (bavarder → bavard)', grade: 'CE1', params: { ask: 'family' } },
  ]),

  generate({ rng, params }) {
    const size = (w: string) => Math.max(6, w.length + 2);
    if (params.ask === 'family') {
      const [base, det, answer] = rng.pick(D_FROM_FAMILY);
      return {
        widget: 'fill-blank',
        instruction: 'RETROUVE le mot de la même famille : il finit par un d muet.',
        prompt: `${base} → ${det ? `${det} ` : ''}{0}`,
        blanks: [{ kind: 'text', size: size(answer) }],
        data: { base, answer, ask: params.ask },
      };
    }
    const [m, f] = rng.pick(D_FEMININE);
    const feminine = params.ask === 'feminine';
    const [base, answer] = feminine ? [m, f] : [f, m];
    return {
      widget: 'fill-blank',
      instruction: feminine ? 'ÉCRIS l’adjectif au féminin.' : 'ÉCRIS l’adjectif au masculin.',
      prompt: feminine ? `il est ${base} → elle est {0}` : `elle est ${base} → il est {0}`,
      blanks: [{ kind: 'text', size: size(answer) }],
      data: { base, answer, ask: params.ask },
    };
  },

  solve: (q) => ({ values: [q.data.answer] }),

  explain(q) {
    const { base, answer } = q.data;
    if (q.data.ask === 'feminine')
      return `Au féminin, on ajoute un e et on entend le d : ${base} → ${answer}.`;
    if (q.data.ask === 'masculine')
      return `Au féminin, « ${base} », on entend le d : au masculin, « ${answer} », il est muet.`;
    return `Dans « ${base} », on entend le d : « ${answer} » finit par un d muet.`;
  },

  signature: (q) => q.data.base,
});
