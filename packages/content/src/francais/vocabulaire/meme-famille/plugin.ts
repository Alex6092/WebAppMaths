import { defineLevels, definePlugin } from '@app/core';
import { FAMILIES } from '../../lib/familles';

// Leçon « Les familles de mots » : trouver les mots de la famille d'un mot.

interface Params {
  /** Mots de la famille parmi les choix (1 : un seul à trouver). */
  right: number;
  choices: number;
}

interface Data {
  base: string;
  right: string[];
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.vocabulaire.meme-famille',
  version: 1,
  title: 'Quel mot est de la même famille ?',
  description: 'Les mots qui ont une partie commune et la même idée.',
  icon: '👪',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Un mot parmi trois', grade: 'CE1', params: { right: 1, choices: 3 } },
    { label: 'Coche tous les mots de la famille', grade: 'CE1', params: { right: 2, choices: 5 } },
  ]),

  generate({ rng, params }) {
    const family = rng.pick(FAMILIES.filter((f) => f.words.length >= params.right));
    const right = rng.sample(family.words, params.right);
    const others = rng
      .sample(
        FAMILIES.filter((f) => f !== family),
        params.choices - params.right,
      )
      .map((f) => rng.pick([f.base, ...f.words]));
    const words = rng.shuffle([...right, ...others]);
    const many = params.right > 1;
    return {
      widget: 'mcq',
      instruction: many
        ? `COCHE les mots de la famille de « ${family.base} ».`
        : `COCHE le mot de la même famille que « ${family.base} ».`,
      choices: words.map((w) => ({ id: w, label: w })),
      multiple: many,
      layout: 'grid',
      data: { base: family.base, right },
    };
  },

  solve: (q) => ({
    selected: q.choices.filter((c) => q.data.right.includes(c.id)).map((c) => c.id),
  }),

  explain: (q) =>
    `${q.data.right.map((w) => `« ${w} »`).join(' et ')} ${q.data.right.length > 1 ? 'sont' : 'est'} de la famille de « ${q.data.base} » : une partie commune et la même idée.`,

  signature: (q) =>
    `${q.data.base}:${q.choices
      .map((c) => c.id)
      .sort()
      .join('|')}`,
});
