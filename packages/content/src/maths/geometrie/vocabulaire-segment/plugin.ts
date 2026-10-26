import { defineLevels, definePlugin, type Blank } from '@app/core';
import { segmentLetters } from '../../lib/geometrie';

// GEOM 2, exercice 2 : « COMPLÈTE avec extrémités – milieu – longueur. »

interface Params {
  /** Nombre de phrases à compléter (1 à 3). */
  sentences: number;
}

interface Data {
  words: string[];
}

const WORDS = ['extrémités', 'milieu', 'longueur'];

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.geometrie.vocabulaire-segment',
  version: 1,
  title: 'Les mots du segment',
  description: 'Complète avec extrémités, milieu ou longueur.',
  icon: '📝',
  notions: ['maths.geometrie.segment'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Une phrase', grade: 'CE1', params: { sentences: 1 } },
    { label: 'Les trois phrases', grade: 'CE1', params: { sentences: 3 } },
  ]),

  generate({ rng, params }) {
    const [a, b] = segmentLetters(rng);
    const all = [
      `Les points ${a} et ${b} sont les {i} du segment [${a}${b}].`,
      `Le point M est le {i} du segment [${a}${b}].`,
      'Il partage le segment en deux segments de même {i}.',
    ];
    const chosen =
      params.sentences >= 3 ? [0, 1, 2] : rng.sample([0, 1, 2], params.sentences).sort();
    const prompt = chosen.map((s, i) => all[s]!.replace('{i}', `{${i}}`)).join('\n');
    const blanks: Blank[] = chosen.map(() => ({ kind: 'choice', options: WORDS }));
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE avec extrémités – milieu – longueur.',
      prompt,
      blanks,
      figure: {
        width: 12,
        height: 2.2,
        points: [
          { id: a, label: a, x: 1.5, y: 1.2, mark: 'tick' },
          { id: 'M', label: 'M', x: 6, y: 1.2, mark: 'tick' },
          { id: b, label: b, x: 10.5, y: 1.2, mark: 'tick' },
        ],
        segments: [{ from: a, to: b }],
      },
      data: { words: chosen.map((s) => WORDS[s]!) },
    };
  },

  solve: (q) => ({ values: q.data.words }),

  explain: () =>
    'Les extrémités sont les deux points au bout du segment. Le milieu le partage en deux ' +
    'segments de même longueur.',
});
