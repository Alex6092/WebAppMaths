import { defineLevels, definePlugin } from '@app/core';
import { E_COLORS, E_NOTION, E_WORDS, type ESound } from '../../lib/lettre-e';

// ORTHO 8 : la lettre e et ses sons, avec un code couleur comme sur les fiches de la classe.

interface Params {
  sounds: ESound[];
  /** Mots par son. */
  perSound: number;
}

interface Data {
  sounds: ESound[];
}

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.orthographe.lettre-e-colorie',
  version: 1,
  title: 'Le code couleur de la lettre e',
  description:
    'Lis le mot : la lettre e fait [e], [é], [è], ou elle est muette ? Et avec d’autres lettres ?',
  icon: '🎨',
  notions: [E_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: '[e], [é], [è] ou muet',
      grade: 'CE1',
      params: { sounds: ['e', 'é', 'è', 'muet'], perSound: 2 },
    },
    {
      label: 'eau, en, eu, ein',
      grade: 'CE1',
      params: { sounds: ['o', 'an', 'eu', 'in'], perSound: 2 },
    },
  ]),

  generate({ rng, params }) {
    const words = rng.shuffle(
      params.sounds.flatMap((sound) =>
        rng.sample(E_WORDS[sound], params.perSound).map((text) => ({ text, sound })),
      ),
    );
    return {
      widget: 'word-select',
      instruction: 'COLORIE selon le code couleur : quel son fait la lettre e ?',
      layout: 'grid',
      mark: 'color',
      tokens: words.map(({ text }) => ({ text })),
      colors: params.sounds.map((s) => E_COLORS[s]),
      data: { sounds: words.map(({ sound }) => sound) },
    };
  },

  solve: (q) => ({ picks: [...q.data.sounds] }),

  explain: (q) => {
    const sounds = [...new Set(q.data.sounds)];
    return sounds
      .map((s) => {
        const words = q.tokens.filter((_, i) => q.data.sounds[i] === s).map((t) => t.text);
        return `${E_COLORS[s].label.replace(/ en \S+$/, '')} : ${words.join(', ')}`;
      })
      .join(' ; ');
  },
});
