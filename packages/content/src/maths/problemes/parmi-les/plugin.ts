import {
  compareBlanks,
  defineLevels,
  definePlugin,
  type Blank,
  type CheckResult,
  type FillBlankAnswer,
  type Rng,
} from '@app/core';
import {
  groupProblem,
  ofArticle,
  PICTURE_SCENES,
  SCENES,
  statementText,
  thisPlace,
  type Place,
  type Scene,
  type Sort,
} from '../../lib/problemes';

// « Résolution de problèmes de composition » : Parmi les fleurs du jardin, il y a 49 tulipes et 60 roses.

interface Params {
  /**
   * question : la question donne le mot qui regroupe ; picture : on compte sur l'image ;
   * statement : l'énoncé seul ; typed : l'énoncé seul, et les mots à écrire.
   */
  mode: 'question' | 'picture' | 'statement' | 'typed';
}

interface Data {
  whole: string;
  /** Le lieu à écrire (null : il est déjà écrit, « de ce panier »). */
  place: string | null;
  /** « du jardin », « de ce panier » : pour l'explication. */
  ofPlace: string;
  counts: [number, number];
  sorts: [string, string];
}

const PLURAL_HINT = 'Attention au pluriel : il y en a plusieurs ! ✏️';

/** Des étiquettes à choisir. */
const choice = (options: string[]): Blank => ({ kind: 'choice', options });
const NUMBER: Blank = { kind: 'text', digits: true, size: 3 };

/** Un lieu d'une autre scène : le piège du trou « du … ». */
function otherPlace(rng: Rng, scene: Scene, place: Place): string {
  const nouns = SCENES.filter((s) => s !== scene)
    .flatMap((s) => s.places.map((p) => p.noun))
    .filter((n) => n !== place.noun);
  return rng.pick(nouns);
}

/** Un mot tapé sans le s (ou le x) du pluriel. */
const missingPlural = (data: Data, answer: FillBlankAnswer) =>
  answer.values.some((v) => {
    const typed = v.trim().toLowerCase();
    return (
      typed !== '' &&
      [data.whole, ...data.sorts].some((w) => [`${typed}s`, `${typed}x`].includes(w.toLowerCase()))
    );
  });

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.problemes.parmi-les',
  version: 1,
  title: 'Parmi les…',
  description: 'Parmi les fleurs du jardin, il y a 49 tulipes et 60 roses : complète le texte.',
  icon: '🌷',
  notions: ['maths.problemes.regrouper'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Avec la question', grade: 'CE1', params: { mode: 'question' } },
    { label: 'Avec une image', grade: 'CE1', params: { mode: 'picture' } },
    { label: 'Avec l’énoncé', grade: 'CE1', params: { mode: 'statement' } },
    { label: 'Les mots à écrire', grade: 'CE1', params: { mode: 'typed' } },
  ]),

  generate({ rng, params }) {
    if (params.mode === 'picture') {
      const scene = rng.pick(PICTURE_SCENES);
      const place = rng.pick(scene.places);
      const [k1, k2] = rng.sample(
        scene.sorts.filter((k) => k.icon),
        2,
      ) as [Sort, Sort];
      const counts: [number, number] = [rng.int(2, 8), rng.int(2, 8)];
      const icons = rng.shuffle([
        ...Array<string>(counts[0]).fill(k1.icon ?? ''),
        ...Array<string>(counts[1]).fill(k2.icon ?? ''),
      ]);
      const other = rng.pick(SCENES.filter((s) => s !== scene)).whole;
      const sortChoice = choice(rng.shuffle([k1.word, k2.word, scene.whole]));
      return {
        widget: 'fill-blank',
        instruction: 'REGARDE l’image et COMPLÈTE le texte.',
        picture: { kind: 'icons', icons },
        prompt: `Parmi les {0} de ${thisPlace(place)}, il y a {1} {2} et {3} {4}.`,
        blanks: [
          choice(rng.shuffle([scene.whole, k1.word, k2.word, other])),
          NUMBER,
          sortChoice,
          NUMBER,
          sortChoice,
        ],
        data: {
          whole: scene.whole,
          place: null,
          ofPlace: `de ${thisPlace(place)}`,
          counts,
          sorts: [k1.word, k2.word],
        },
      };
    }

    const p = groupProblem(rng, 'tout', { kinds: ['tout'], max: 100, carry: true });
    const { scene, place, sorts, counts } = p.group!;
    const [k1, k2] = sorts;
    const typed = params.mode === 'typed';
    const word = (size: number): Blank => ({ kind: 'text', size });
    const sortChoice = choice(rng.shuffle([k1.word, k2.word, scene.whole]));
    const other = rng.pick(SCENES.filter((s) => s !== scene)).whole;
    const placeTrap = rng.pick([k1, k2]).word;
    return {
      widget: 'fill-blank',
      instruction: 'LIS l’énoncé et COMPLÈTE le texte.',
      text: params.mode === 'question' ? `${statementText(p)}\n${p.question}` : statementText(p),
      prompt: `Parmi les {0} ${ofArticle(place)}{1}, il y a {2} {3} et {4} {5}.`,
      blanks: [
        typed ? word(10) : choice(rng.shuffle([scene.whole, k1.word, k2.word, other])),
        typed
          ? word(12)
          : choice(
              rng.shuffle([place.noun, placeTrap, scene.whole, otherPlace(rng, scene, place)]),
            ),
        NUMBER,
        typed ? word(14) : sortChoice,
        NUMBER,
        typed ? word(14) : sortChoice,
      ],
      data: {
        whole: scene.whole,
        place: place.noun,
        ofPlace: `${ofArticle(place)}${place.noun}`,
        counts,
        sorts: [k1.word, k2.word],
      },
    };
  },

  solve: (q) => ({
    values: [
      q.data.whole,
      ...(q.data.place ? [q.data.place] : []),
      String(q.data.counts[0]),
      q.data.sorts[0],
      String(q.data.counts[1]),
      q.data.sorts[1],
    ],
  }),

  // Les deux sortes peuvent venir dans un ordre ou dans l'autre.
  check(q, answer): CheckResult {
    const head = [[q.data.whole], ...(q.data.place ? [[q.data.place]] : [])];
    const pair = (a: 0 | 1, b: 0 | 1) => [
      [String(q.data.counts[a])],
      [q.data.sorts[a]],
      [String(q.data.counts[b])],
      [q.data.sorts[b]],
    ];
    const [first, second] = [pair(0, 1), pair(1, 0)].map((p) =>
      compareBlanks(q, [...head, ...p], answer),
    ) as [CheckResult, CheckResult];
    const best = second.score > first.score ? second : first;
    if (!best.correct && missingPlural(q.data, answer)) return { ...best, feedback: PLURAL_HINT };
    return best;
  },

  explain(q) {
    const { whole, ofPlace, counts, sorts } = q.data;
    return `Les ${sorts[0]} et les ${sorts[1]} sont des ${whole} : « Parmi les ${whole} ${ofPlace}, il y a ${counts[0]} ${sorts[0]} et ${counts[1]} ${sorts[1]}. »`;
  },
});
