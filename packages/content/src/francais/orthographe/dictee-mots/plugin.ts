import { defineLevels, definePlugin } from '@app/core';
import { SOUNDS } from '../../lib/dictee';

// La dictée de mots : la voix lit le mot (seul, puis dans un petit groupe), l'enfant l'écrit.

interface Params {
  /** Avec l'image du mot. */
  picture: boolean;
}

interface Data {
  word: string;
  sound: string;
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'francais.orthographe.dictee-mots',
  version: 1,
  title: 'Dictée de mots',
  description: 'Écoute le mot et écris-le.',
  icon: '🎧',
  notions: ['francais.orthographe.dictee'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec l’image', grade: 'CE1', params: { picture: true } },
    { label: 'Sans image', grade: 'CE1', params: { picture: false } },
  ]),

  generate({ rng, params }) {
    const sound = rng.pick(SOUNDS.filter((s) => !params.picture || s.words.some((x) => x.icon)));
    const entry = rng.pick(params.picture ? sound.words.filter((x) => x.icon) : sound.words);
    return {
      widget: 'fill-blank',
      instruction: `ÉCOUTE et ÉCRIS le mot. On entend le son [${sound.label}].`,
      listen: `${entry.word}… ${entry.context}… ${entry.word}.`,
      ...(params.picture && entry.icon
        ? { picture: { kind: 'icons' as const, icons: [entry.icon] } }
        : {}),
      prompt: '{0}',
      blanks: [{ kind: 'text', size: Math.max(6, entry.word.length + 2) }],
      data: { word: entry.word, sound: sound.label },
    };
  },

  solve: (q) => ({ values: [q.data.word] }),

  explain: (q) => `Le mot s’écrit « ${q.data.word} » : écoute bien le son [${q.data.sound}].`,

  signature: (q) => q.data.word,
});
