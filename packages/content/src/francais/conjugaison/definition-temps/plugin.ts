import { defineLevels, definePlugin } from '@app/core';
import { MOMENT_LABEL, MOMENTS, type Moment } from '../../lib/conjugaison';

// CONJ 2, exercice 1 : « COMPLÈTE avec passé, présent ou futur. »

interface Params {
  /** Phrases d'exemple au lieu des définitions. */
  examples: boolean;
}

interface Data {
  moment: Moment;
}

const DEFINITIONS: Record<Moment, string[]> = {
  passe: [
    'Une action qui s’est passée avant est au {0}.',
    'Ce qui s’est passé hier est au {0}.',
    'Une action qui est déjà finie est au {0}.',
  ],
  present: [
    'Une action qui se passe maintenant est au {0}.',
    'Ce qui se passe en ce moment est au {0}.',
    'Une action qui se passe aujourd’hui est au {0}.',
  ],
  futur: [
    'Une action qui se passera après est au {0}.',
    'Ce qui se passera demain est au {0}.',
    'Une action qui n’est pas encore arrivée est au {0}.',
  ],
};

// Exemples de la leçon : le verbe seul indique le moment.
const EXAMPLES: Record<Moment, string[]> = {
  passe: ['j’allais à l’école', 'il chantait', 'nous jouions', 'tu dansais', 'elles mangeaient'],
  present: ['je vais à l’école', 'il chante', 'nous jouons', 'tu danses', 'elles mangent'],
  futur: ['j’irai à l’école', 'il chantera', 'nous jouerons', 'tu danseras', 'elles mangeront'],
};

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.conjugaison.definition-temps',
  version: 1,
  title: 'Passé, présent ou futur ?',
  description: 'Avant, maintenant ou après : choisis le bon mot.',
  icon: '⏰',
  notions: ['francais.conjugaison.passe-present-futur'],
  expectedLevel: 2,
  minVariety: 9,
  levels: defineLevels<Params>([
    { label: 'Avant, maintenant, après', grade: 'CE1', params: { examples: false } },
    { label: 'Le verbe me le dit', grade: 'CE1', params: { examples: true } },
  ]),

  generate({ rng, params }) {
    const moment = rng.pick(MOMENTS);
    const prompt = params.examples
      ? `« ${rng.pick(EXAMPLES[moment])} » : l’action est au {0}.`
      : rng.pick(DEFINITIONS[moment]);
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE avec passé, présent ou futur.',
      prompt,
      blanks: [{ kind: 'choice', options: MOMENTS.map((m) => MOMENT_LABEL[m]) }],
      data: { moment },
    };
  },

  solve: (q) => ({ values: [MOMENT_LABEL[q.data.moment]] }),

  explain: (q) =>
    ({
      passe: 'Le passé, c’est ce qui s’est passé AVANT.',
      present: 'Le présent, c’est ce qui se passe MAINTENANT.',
      futur: 'Le futur, c’est ce qui se passera APRÈS.',
    })[q.data.moment],

  signature: (q) => q.prompt,
});
