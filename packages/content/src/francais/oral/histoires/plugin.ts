import { defineLevels, definePlugin, storySentences, type ComprehensionItem } from '@app/core';
import {
  isWhy,
  LEVEL_RULES,
  proofSentences,
  STORIES,
  storyChoice,
  storyParagraphs,
  typography,
  type StoryLevel,
  type StoryQuestion,
} from '../../lib/histoires';

// Écouter une histoire, puis répondre à quelques questions. L'histoire et ses questions forment
// une seule question de l'app : la suivante raconte une autre histoire.

interface Params {
  level: StoryLevel;
}

interface Data {
  story: string;
  /** Les questions de l'histoire posées, dans l'ordre de l'histoire. */
  picked: number[];
  /** Le bon choix de chaque question. */
  answers: string[];
}

const IDS = ['a', 'b', 'c'];

export default definePlugin<'comprehension', Params, Data>('comprehension', {
  id: 'francais.oral.histoires',
  version: 1,
  title: 'Écoute une histoire',
  description: 'Écoute l’histoire jusqu’au bout, puis réponds aux questions.',
  icon: '🎧',
  notions: ['francais.oral.comprendre-histoire'],
  expectedLevel: 3,
  // Une ou deux minutes d'écoute : trop long pour le défi du jour et « Tout mélanger ».
  inMix: false,
  levels: defineLevels<Params>([
    { label: 'Petites histoires en images', grade: 'CP', params: { level: 1 } },
    { label: 'Histoires et contes', grade: 'CP', params: { level: 2 } },
    { label: 'Avec des « pourquoi ? »', grade: 'CE1', params: { level: 3 } },
    { label: 'Contes plus longs', grade: 'CE2', params: { level: 4 } },
  ]),

  generate({ rng, params }) {
    const rules = LEVEL_RULES[params.level];
    const story = rng.pick(STORIES.filter((s) => s.level === params.level));
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
      instruction: 'ÉCOUTE l’histoire, puis RÉPONDS aux questions.',
      title: story.title,
      icon: story.icon,
      story: storyParagraphs(story).map((p) => p.map(typography)),
      items,
      data: { story: story.id, picked, answers },
    };
  },

  solve: (q) => ({ selected: [...q.data.answers] }),

  // La première question ratée, avec la phrase de l'histoire qui donne la réponse.
  explain(q, answer) {
    const i = q.items.findIndex((_, k) => answer.selected[k] !== q.data.answers[k]);
    const item = q.items[i];
    if (!item) return undefined;
    const right = item.choices.find((c) => c.id === q.data.answers[i])?.label;
    return `Question ${i + 1} : la réponse est « ${right} ». Dans l’histoire : « ${storySentences(q)[item.proof]} »`;
  },

  invariants(q, { params }) {
    const rules = LEVEL_RULES[params.level];
    const story = STORIES.find((s) => s.id === q.data.story);
    if (story?.level !== params.level) return 'histoire d’un autre niveau';
    if (q.items.length !== rules.questions) return `${q.items.length} questions`;
    if (rules.why && !q.data.picked.some((i) => isWhy(story.questions[i]!)))
      return 'pas de « pourquoi ? »';
    const proofs = q.items.map((item) => item.proof);
    if (proofs.some((p, k) => k > 0 && p < proofs[k - 1]!)) return 'questions dans le désordre';
    if (rules.pictures && q.items.some((item) => item.choices.some((c) => !c.icon)))
      return 'un choix sans image au CP';
    return undefined;
  },

  signature: (q) => `${q.data.story}:${q.data.picked.join(',')}`,
});
