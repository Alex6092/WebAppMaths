import { defineLevels, definePlugin } from '@app/core';
import { capitalize, PICTURE_SCENES, SCENES, type Scene } from '../../lib/problemes';

// Les tulipes et les roses sont des… fleurs : le mot qui regroupe (le « terme générique »).

interface Params {
  /** pictures : deux sortes, avec leur image ; words : trois sortes ; intruder : l'intrus. */
  mode: 'pictures' | 'words' | 'intruder';
}

interface Data {
  answer: string;
  whole: string;
  sorts: string[];
}

/** « billes rouges » et « billes vertes » sont des billes : trop facile, on les laisse de côté. */
const WORD_SCENES = SCENES.filter((s) => s.sorts.every((k) => !k.adj));

/** Deux mots qui ne regroupent pas les mêmes choses (les fourmis sont aussi des animaux). */
const apart = (a: Scene, b: Scene) =>
  a !== b && !a.broader?.includes(b.whole) && !b.broader?.includes(a.whole);

/** « Les tulipes, les roses et les marguerites » */
function listOf(words: readonly string[]): string {
  const items = words.map((w) => `les ${w}`);
  const last = items.pop()!;
  return capitalize(items.length ? `${items.join(', ')} et ${last}` : last);
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'maths.problemes.mot-qui-regroupe',
  version: 1,
  title: 'Le mot qui regroupe',
  description: 'Les tulipes et les roses sont des fleurs : trouve le mot qui regroupe.',
  icon: '🧺',
  notions: ['maths.problemes.regrouper'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec les images', grade: 'CE1', params: { mode: 'pictures' } },
    { label: 'Avec les mots', grade: 'CE1', params: { mode: 'words' } },
    { label: 'Trouve l’intrus', grade: 'CE1', params: { mode: 'intruder' } },
  ]),

  generate({ rng, params }) {
    if (params.mode === 'intruder') {
      const scene = rng.pick(WORD_SCENES.filter((s) => s.sorts.length >= 3));
      const three = rng.sample(scene.sorts, 3).map((k) => k.word);
      const other = rng.pick(WORD_SCENES.filter((o) => apart(scene, o)));
      const intruder = rng.pick(
        other.sorts.filter((k) => !scene.sorts.some((s) => s.word === k.word)),
      );
      return {
        widget: 'mcq',
        instruction: `COCHE l’intrus : le mot qui ne fait pas partie des ${scene.whole}.`,
        choices: rng.shuffle([...three, intruder.word]).map((w) => ({ id: w, label: w })),
        multiple: false,
        layout: 'grid',
        data: { answer: intruder.word, whole: scene.whole, sorts: three },
      };
    }
    const pictures = params.mode === 'pictures';
    const pool = pictures ? PICTURE_SCENES.filter((s) => WORD_SCENES.includes(s)) : WORD_SCENES;
    const scene = rng.pick(pool);
    const shown = rng.sample(
      pictures ? scene.sorts.filter((k) => k.icon) : scene.sorts,
      pictures ? 2 : Math.min(3, scene.sorts.length),
    );
    // Les pièges : une autre sorte de la même famille, et d'autres mots qui regroupent.
    const trap = scene.sorts.find((k) => !shown.includes(k))?.word;
    const others = rng
      .sample(
        WORD_SCENES.filter((o) => apart(scene, o)),
        trap ? 2 : 3,
      )
      .map((o) => o.whole);
    const choices = [scene.whole, ...others, ...(trap ? [trap] : [])];
    return {
      widget: 'mcq',
      instruction: 'COCHE le mot qui regroupe.',
      prompt: `${listOf(shown.map((k) => k.word))} sont des {?}.`,
      ...(pictures
        ? { picture: { kind: 'icons' as const, icons: shown.map((k) => k.icon ?? '') } }
        : {}),
      choices: rng.shuffle(choices).map((w) => ({ id: w, label: w })),
      multiple: false,
      layout: 'grid',
      data: { answer: scene.whole, whole: scene.whole, sorts: shown.map((k) => k.word) },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const list = listOf(q.data.sorts);
    if (q.data.answer !== q.data.whole)
      return `${list} sont des ${q.data.whole}. Les ${q.data.answer}, non : c’est l’intrus.`;
    return `${list} sont des ${q.data.whole} : « ${q.data.whole} » est le mot qui les regroupe.`;
  },
});
