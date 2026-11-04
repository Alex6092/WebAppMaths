import { defineLevels, definePlugin } from '@app/core';
import { FAMILIES, familyTraps, trapReason, type Trap } from '../../lib/familles';

// Leçon « Les familles de mots » : trouver les mots de la famille d'un mot. Aux derniers
// niveaux, comme sur les fiches de la classe, des pièges : un mot qui se ressemble (loin → loi)
// ou qui parle de la même chose (jardin → pelle).

interface Params {
  /** Mots de la famille parmi les choix (1 : un seul à trouver). */
  right: number;
  choices: number;
  /** Mots pièges parmi les choix. */
  traps: number;
}

interface Data {
  base: string;
  right: string[];
  traps: Trap[];
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.vocabulaire.meme-famille',
  version: 2,
  title: 'Quel mot est de la même famille ?',
  description: 'Les mots qui ont une partie commune et la même idée.',
  icon: '👪',
  notions: ['francais.vocabulaire.familles'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Un mot parmi trois', grade: 'CE1', params: { right: 1, choices: 3, traps: 0 } },
    {
      label: 'Coche tous les mots de la famille',
      grade: 'CE1',
      params: { right: 2, choices: 5, traps: 0 },
    },
    {
      label: 'Un mot parmi trois, avec un piège',
      grade: 'CE1',
      params: { right: 1, choices: 3, traps: 1 },
    },
    {
      label: 'Tous les mots de la famille, avec des pièges',
      grade: 'CE1',
      params: { right: 3, choices: 5, traps: 2 },
    },
  ]),

  generate({ rng, params }) {
    const family = rng.pick(
      FAMILIES.filter(
        (f) => f.words.length >= params.right && familyTraps(f).length >= params.traps,
      ),
    );
    const right = rng.sample(family.words, params.right);
    const traps = rng.sample(familyTraps(family), params.traps);
    // Un piège « du même thème » peut être le mot d'une autre famille (fleur → jardin).
    const taken = new Set(traps.map((t) => t.word));
    const others = rng
      .shuffle(FAMILIES.filter((f) => f !== family))
      .map((f) => rng.pick([f.base, ...f.words]))
      .filter((w) => !taken.has(w))
      .slice(0, params.choices - params.right - params.traps);
    const words = rng.shuffle([...right, ...traps.map((t) => t.word), ...others]);
    const many = params.right > 1;
    return {
      widget: 'mcq',
      instruction: many
        ? `COCHE les mots de la famille de « ${family.base} ».`
        : `COCHE le mot de la même famille que « ${family.base} ».`,
      choices: words.map((w) => ({ id: w, label: w })),
      multiple: many,
      layout: 'grid',
      data: { base: family.base, right, traps },
    };
  },

  solve: (q) => ({
    selected: q.choices.filter((c) => q.data.right.includes(c.id)).map((c) => c.id),
  }),

  explain: (q) =>
    [
      `${q.data.right.map((w) => `« ${w} »`).join(', ')} ${q.data.right.length > 1 ? 'sont' : 'est'} de la famille de « ${q.data.base} » : une partie commune et la même idée.`,
      ...q.data.traps.map((t) => trapReason(q.data.base, t)),
    ].join(' '),

  invariants: (q, { params }) =>
    q.choices.length !== params.choices
      ? `${q.choices.length} choix`
      : q.data.traps.length !== params.traps
        ? 'pièges manquants'
        : undefined,

  signature: (q) =>
    `${q.data.base}:${q.choices
      .map((c) => c.id)
      .sort()
      .join('|')}`,
});
