import {
  storySentences,
  type ComprehensionAnswer,
  type ComprehensionItem,
  type PluginQuestion,
  type Rng,
} from '@app/core';
import {
  isWhy,
  LEVEL_RULES,
  proofSentences,
  STORIES,
  storyChoice,
  storyParagraphs,
  typography,
  type Story,
  type StoryLevel,
  type StoryQuestion,
} from './index';

/**
 * Une histoire et quelques-unes de ses questions : une question de l'app, à écouter (Langage
 * oral, anglais) ou à lire (Lecture). Les exercices tirent tous de la même façon.
 */

export interface StoryData {
  story: string;
  /** Les questions de l'histoire posées, dans l'ordre de l'histoire. */
  picked: number[];
  /** Le bon choix de chaque question. */
  answers: string[];
}

export type StoryExercise = PluginQuestion<'comprehension', StoryData>;

const IDS = ['a', 'b', 'c'];

/** Ce qu'un niveau demande aux questions tirées. */
export interface PickRules {
  questions: number;
  /** Au moins un « pourquoi ? ». */
  why: boolean;
  /** Toutes les réponses en images. */
  pictures: boolean;
}

export interface StoryOptions {
  instruction: string;
  /** Un texte à lire seul (Lecture), plutôt qu'à écouter. */
  read: boolean;
  /** La langue de l'histoire (« en-GB ») : le français sinon. */
  lang?: string;
  /** L'histoire en français, montrée après la correction (une histoire en anglais). */
  translation?: string[];
}

/** Une histoire des contes et des histoires en français, du niveau demandé. */
export function storyExercise(rng: Rng, level: StoryLevel, options: StoryOptions): StoryExercise {
  const story = rng.pick(STORIES.filter((s) => s.level === level));
  return storyQuestion(rng, story, LEVEL_RULES[level], options);
}

/** Les questions d'une histoire donnée, tirées selon les règles de son niveau. */
export function storyQuestion(
  rng: Rng,
  story: Pick<Story, 'id' | 'title' | 'icon' | 'text' | 'questions'>,
  rules: PickRules,
  { instruction, read, lang, translation }: StoryOptions,
): StoryExercise {
  const proof = (i: number) => proofSentences(story, story.questions[i]!.proof)[0]!;
  const order = rng.shuffle(story.questions.map((_, i) => i));
  const picked = order.slice(0, rules.questions);
  // Au CE1 et au CE2, au moins un « pourquoi ? ».
  if (rules.why && !picked.some((i) => isWhy(story.questions[i]!))) {
    picked[picked.length - 1] = order.find((i) => isWhy(story.questions[i]!))!;
  }
  // Les questions suivent l'ordre de l'histoire.
  picked.sort((a, b) => proof(a) - proof(b) || a - b);

  const items: ComprehensionItem[] = [];
  const answers: string[] = [];
  for (const i of picked) {
    const q: StoryQuestion = story.questions[i]!;
    if ('claim' in q) {
      items.push({
        ask: typography(`« ${q.claim} »`),
        choices: [storyChoice('✅ Vrai', 'a'), storyChoice('❌ Faux', 'b')],
        proof: proof(i),
      });
      answers.push(q.truth ? 'a' : 'b');
      continue;
    }
    const labels = rng.shuffle([q.answer, ...q.wrong]);
    items.push({
      ask: typography(q.ask),
      choices: labels.map((label, k) => storyChoice(label, IDS[k]!)),
      proof: proof(i),
    });
    answers.push(IDS[labels.indexOf(q.answer)]!);
  }

  return {
    widget: 'comprehension',
    instruction,
    title: story.title,
    icon: story.icon,
    story: storyParagraphs(story).map((p) => p.map(typography)),
    ...(read ? { read: true } : {}),
    ...(lang ? { lang } : {}),
    ...(translation ? { translation } : {}),
    items,
    data: { story: story.id, picked, answers },
  };
}

export const solveStory = (q: StoryExercise): ComprehensionAnswer => ({
  selected: [...q.data.answers],
});

/** La première question ratée, avec la phrase qui donne la réponse. */
export function explainStory(q: StoryExercise, answer: ComprehensionAnswer): string | undefined {
  const i = q.items.findIndex((_, k) => answer.selected[k] !== q.data.answers[k]);
  const item = q.items[i];
  if (!item) return undefined;
  const right = item.choices.find((c) => c.id === q.data.answers[i])?.label;
  const where = q.read ? 'Dans le texte' : 'Dans l’histoire';
  return `Question ${i + 1} : la réponse est « ${right} ». ${where} : « ${storySentences(q)[item.proof]} »`;
}

export function storyInvariants(q: StoryExercise, level: StoryLevel): string | undefined {
  const story = STORIES.find((s) => s.id === q.data.story);
  if (story?.level !== level) return 'histoire d’un autre niveau';
  return pickedInvariants(q, story, LEVEL_RULES[level]);
}

/** Les questions tirées respectent les règles du niveau. */
export function pickedInvariants(
  q: StoryExercise,
  story: Pick<Story, 'questions'>,
  rules: PickRules,
): string | undefined {
  if (q.items.length !== rules.questions) return `${q.items.length} questions`;
  if (rules.why && !q.data.picked.some((i) => isWhy(story.questions[i]!)))
    return 'pas de « pourquoi ? »';
  const proofs = q.items.map((item) => item.proof);
  if (proofs.some((p, k) => k > 0 && p < proofs[k - 1]!)) return 'questions dans le désordre';
  if (rules.pictures && q.items.some((item) => item.choices.some((c) => !c.icon)))
    return 'un choix sans image au CP';
  return undefined;
}
