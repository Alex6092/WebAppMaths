import { defineLevels, definePlugin, type MatchColumn } from '@app/core';
import { SENSE_ACTIONS, SENSES } from '../../lib/vivant';

// « RELIE l'organe à son sens », puis à un exemple : les yeux → la vue → regarder un arc-en-ciel.

interface Params {
  /** Une troisième colonne : ce qu'on fait avec ce sens. */
  withAction: boolean;
}

interface Data {
  /** links[c][i] : la carte de la colonne c + 1 reliée à la carte i de la colonne c. */
  links: number[][];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'qlm.vivant.relie-sens',
  version: 1,
  title: 'Les cinq sens',
  description: 'Les yeux pour la vue, le nez pour l’odorat : relie l’organe à son sens.',
  icon: '👀',
  notions: ['qlm.vivant.sens'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'L’organe et son sens', grade: 'CE1', params: { withAction: false } },
    { label: 'Et ce qu’on fait avec', grade: 'CE1', params: { withAction: true } },
  ]),

  generate({ rng, params }) {
    // Quatre sens au 2e niveau : trois colonnes de cinq cartes, c'est trop sur une tablette.
    const senses = rng.shuffle(rng.sample(SENSES, params.withAction ? 4 : 5));
    const middle = rng.shuffle(senses.map((_, i) => i));
    const columns: MatchColumn[] = [
      { title: 'l’organe', cards: senses.map((s) => ({ text: s.organ, icon: s.icon })) },
      { title: 'le sens', cards: middle.map((i) => ({ text: senses[i]!.sense })) },
    ];
    const links = [senses.map((_, i) => middle.indexOf(i))];
    if (params.withAction) {
      const actions = senses.map((s) => rng.pick(SENSE_ACTIONS.filter((a) => a.sense === s.id)));
      const last = rng.shuffle(senses.map((_, i) => i));
      columns.push({
        title: 'pour…',
        cards: last.map((i) => ({ text: actions[i]!.text, icon: actions[i]!.icon })),
      });
      // La carte du milieu numéro m montre le sens middle[m] : elle se relie à son exemple.
      links.push(middle.map((i) => last.indexOf(i)));
    }
    return {
      widget: 'match',
      instruction: params.withAction
        ? 'RELIE chaque organe à son sens, puis le sens à ce qu’on fait avec.'
        : 'RELIE chaque organe à son sens.',
      columns,
      data: { links },
    };
  },

  solve: (q) => ({ links: q.data.links.map((l) => [...l]) }),

  explain: () =>
    'Les yeux : la vue. Les oreilles : l’ouïe. Le nez : l’odorat. La langue : le goût. La peau : le toucher.',
});
