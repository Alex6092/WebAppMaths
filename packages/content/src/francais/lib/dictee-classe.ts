import { defineLevels, definePlugin, type Blank, type LessonBlock, type Notion } from '@app/core';
import { sentenceWords } from './dictee';

/**
 * Les dictées de la classe : les listes de mots données par la maîtresse, à apprendre avec leur
 * déterminant. Chaque dictée est une notion à part : le parent peut la donner en devoir ou en
 * fiche la semaine où elle tombe. Pour en ajouter une : une entrée dans CLASS_DICTATIONS, un
 * dossier orthographe/dictee-<n>/plugin.ts, et sa notion vient toute seule.
 */

export type Nature = 'nom' | 'adjectif' | 'adverbe' | 'verbe';

export interface ClassWord {
  /** Le déterminant appris avec le nom : « une », « l’ ». */
  det?: string;
  word: string;
  nature: Nature;
  /** Un groupe de mots pour l'entendre (les noms s'entendent avec leur déterminant). */
  context?: string;
  /** Un nom propre : la majuscule compte (l’Italie). */
  proper?: boolean;
}

export interface ClassList {
  label: string;
  words: ClassWord[];
}

export interface ClassDictation {
  number: number;
  /** « La lettre T » */
  title: string;
  lists: ClassList[];
  /** Des phrases courtes faites avec les mots des listes. */
  sentences: string[];
}

const noun = (det: string, word: string, proper = false): ClassWord => ({
  det,
  word,
  nature: 'nom',
  ...(proper ? { proper } : {}),
});
const other = (nature: Nature, word: string, context: string): ClassWord => ({
  word,
  nature,
  context,
});

export const DICTEE_4: ClassDictation = {
  number: 4,
  title: 'La lettre T',
  lists: [
    {
      label: 'Liste 1 (pour vendredi)',
      words: [
        noun('une', 'carte'),
        noun('un', 'enfant'),
        noun('l’', 'Italie', true),
        other('adjectif', 'postal', 'un code postal'),
        other('verbe', 'montrer', 'montrer le chemin'),
      ],
    },
    {
      label: 'Liste 2 (pour lundi)',
      words: [
        noun('une', 'tradition'),
        noun('la', 'culture'),
        noun('l’', 'histoire'),
        other('adjectif', 'différent', 'un chemin différent'),
        other('adverbe', 'devant', 'devant la porte'),
      ],
    },
  ],
  sentences: [
    'Lila montre une carte de l’Italie.',
    'Cet enfant raconte une histoire.',
    'Écris le code postal sur la carte.',
    'Mamie aime la culture de l’Italie.',
    'Chaque pays a une tradition différente.',
    'L’enfant est devant la carte.',
    'Nous lisons l’histoire de l’Italie.',
    'Tom montre une carte à un enfant.',
    'Cette tradition est très différente.',
    'J’aime la culture et l’histoire.',
    'Devant la maison, un enfant joue.',
    'Papa me montre le code postal.',
  ],
};

export const CLASS_DICTATIONS: readonly ClassDictation[] = [DICTEE_4];

const idOf = (d: ClassDictation) => `francais.orthographe.dictee-${d.number}`;
/** « une carte », « l’Italie », « postal » */
export const written = (w: ClassWord) =>
  w.det ? `${w.det}${w.det.endsWith('’') ? '' : ' '}${w.word}` : w.word;

const NATURE_TITLE: Record<Nature, string> = {
  nom: 'les noms',
  adjectif: 'les adjectifs',
  adverbe: 'les adverbes',
  verbe: 'les verbes',
};

/** La leçon : les deux listes, rangées par nature comme sur la fiche de la classe. */
function dictationLesson(d: ClassDictation): LessonBlock[] {
  const natures = (['nom', 'adjectif', 'adverbe', 'verbe'] as const).filter((n) =>
    d.lists.some((l) => l.words.some((w) => w.nature === n)),
  );
  return [
    `Les mots de la **dictée ${d.number}**. J’apprends les noms **avec leur déterminant** (une, un, la, l’).`,
    {
      kind: 'table',
      columns: d.lists.map((list) => ({
        title: list.label,
        cells: natures.map((n) => {
          const words = list.words.filter((w) => w.nature === n).map(written);
          return `**${NATURE_TITLE[n]}** : ${words.length ? words.join(', ') : '–'}`;
        }),
      })),
    },
    'Pour bien les retenir : je lis le mot, je le cache, je l’écris, puis je vérifie.',
  ];
}

export const classDictationNotion = (d: ClassDictation): Notion => ({
  id: idOf(d),
  domain: 'francais.orthographe',
  title: `Dictée ${d.number} : ${d.title.charAt(0).toLowerCase()}${d.title.slice(1)}`,
  grades: ['CE1'],
  competence: `Écrire les mots de la dictée ${d.number} de la classe.`,
  lesson: dictationLesson(d),
});

interface Params {
  /** Les listes du niveau (numéros), ou null pour des phrases faites avec les mots. */
  lists: number[] | null;
}

interface Data {
  values: string[];
  text: string;
}

/** La dictée de la classe : chaque liste, les deux, puis des phrases avec les mots. */
export function classDictationPlugin(d: ClassDictation) {
  const lists = d.lists.map((l, i) => ({
    label: l.label,
    grade: 'CE1' as const,
    params: { lists: [i] },
  }));
  return definePlugin<'fill-blank', Params, Data>('fill-blank', {
    id: idOf(d),
    version: 1,
    title: `Dictée ${d.number} : ${d.title}`,
    description: `Les mots de la dictée ${d.number} de la classe.`,
    icon: '🏫',
    notions: [idOf(d)],
    expectedLevel: d.lists.length + 1,
    levels: defineLevels<Params>([
      ...lists,
      { label: 'Toutes les listes', grade: 'CE1', params: { lists: d.lists.map((_, i) => i) } },
      { label: 'Des phrases avec les mots', grade: 'CE1', params: { lists: null } },
    ]),
    minVariety: Math.min(10, ...d.lists.map((l) => l.words.length)),

    generate({ rng, params }) {
      if (params.lists === null) {
        const sentence = rng.pick(d.sentences);
        const { words, end } = sentenceWords(sentence);
        return {
          widget: 'fill-blank',
          instruction: 'ÉCOUTE la phrase et ÉCRIS chaque mot dans sa case.',
          listen: sentence,
          prompt: `${words.map((_, i) => `{${i}}`).join(' ')}${end}`,
          blanks: words.map((w) => ({ kind: 'text' as const, size: Math.max(3, w.length + 1) })),
          data: { values: words, text: sentence },
        };
      }
      const word = rng.pick(params.lists.flatMap((i) => d.lists[i]!.words));
      const text = written(word);
      const context = word.context ?? text;
      const size = (w: string): Blank => ({ kind: 'text', size: Math.max(3, w.length + 2) });
      // Un nom : le déterminant et le nom, chacun dans sa case.
      const blanks = word.det ? [size(word.det), size(word.word)] : [size(word.word)];
      const glued = word.det?.endsWith('’');
      return {
        widget: 'fill-blank',
        instruction: word.det
          ? 'ÉCOUTE et ÉCRIS le mot avec son déterminant.'
          : 'ÉCOUTE et ÉCRIS le mot.',
        listen: `${text}… ${context}… ${text}.`,
        prompt: word.det ? (glued ? '{0}{1}' : '{0} {1}') : '{0}',
        blanks,
        ...(word.proper ? { caseSensitive: true } : {}),
        data: { values: word.det ? [word.det, word.word] : [word.word], text },
      };
    },

    solve: (q) => ({ values: [...q.data.values] }),

    explain: (q) => `On écrit : « ${q.data.text} »`,

    signature: (q) => q.data.text,
  });
}
