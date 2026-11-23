import { defineLevels, definePlugin } from '@app/core';
import { A_COLORS, A_NOTION, A_WORDS, DICTEE_7_NOTION, type ASound } from '../../lib/lettre-a';

// Dictée 7, exercice 1 : « COLORIE selon le code couleur » : [a] bleu, [o] rouge, [è] vert,
// [aj] marron, [in] orange, [an] jaune.

interface Params {
  sounds: ASound[];
  /** Mots par son. */
  perSound: number;
}

interface Data {
  sounds: ASound[];
}

const ALL: ASound[] = ['a', 'o', 'e', 'aj', 'in', 'an'];

export default definePlugin<'word-select', Params, Data>('word-select', {
  id: 'francais.orthographe.lettre-a-colorie',
  version: 1,
  title: 'Le code couleur de la lettre a',
  description: 'Lis le mot : quel son fait la lettre a ? [a], [o], [è], [aj], [in] ou [an].',
  icon: '🎨',
  notions: [A_NOTION, DICTEE_7_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    {
      label: '[a], [o], [è] et [an]',
      grade: 'CE1',
      params: { sounds: ['a', 'o', 'e', 'an'], perSound: 2 },
    },
    { label: 'Les six couleurs', grade: 'CE1', params: { sounds: ALL, perSound: 2 } },
  ]),

  generate({ rng, params }) {
    const words = rng.shuffle(
      params.sounds.flatMap((sound) =>
        rng.sample(A_WORDS[sound], params.perSound).map((text) => ({ text, sound })),
      ),
    );
    return {
      widget: 'word-select',
      instruction: 'COLORIE selon le code couleur : quel son fait la lettre a ?',
      layout: 'grid',
      mark: 'color',
      tokens: words.map(({ text }) => ({ text })),
      colors: params.sounds.map((s) => A_COLORS[s]),
      data: { sounds: words.map(({ sound }) => sound) },
    };
  },

  solve: (q) => ({ picks: [...q.data.sounds] }),

  explain: (q) => {
    const sounds = [...new Set(q.data.sounds)];
    return sounds
      .map((s) => {
        const words = q.tokens.filter((_, i) => q.data.sounds[i] === s).map((t) => t.text);
        return `${A_COLORS[s].label.split(' ')[0]} : ${words.join(', ')}`;
      })
      .join(' ; ');
  },
});
