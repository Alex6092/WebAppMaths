import { defineLevels, definePlugin, storySentences } from '@app/core';
import {
  LEVEL_RULES,
  MIN_STORIES_PER_LEVEL,
  proofSentences,
  STORIES,
  storyParagraphs,
  typography,
  type StoryLevel,
} from '../../lib/histoires';

// Écouter une histoire, puis remettre dans l'ordre quelques-uns de ses événements, montrés
// mélangés : qu'est-ce qui s'est passé d'abord ?

interface Params {
  level: StoryLevel;
}

interface Data {
  story: string;
  /** Les événements de l'histoire montrés, dans l'ordre où ils sont montrés. */
  shown: number[];
  /** Le bon ordre : l'événement montré qui va dans chaque case. */
  order: number[];
}

export default definePlugin<'comprehension', Params, Data>('comprehension', {
  id: 'francais.oral.ordre-histoire',
  version: 1,
  title: 'Remets l’histoire dans l’ordre',
  description: 'Écoute l’histoire, puis range ce qui s’est passé, du début à la fin.',
  icon: '🔢',
  notions: ['francais.oral.comprendre-histoire'],
  expectedLevel: 2,
  // Une ou deux minutes d'écoute : trop long pour le défi du jour et « Tout mélanger ».
  inMix: false,
  levels: defineLevels<Params>([
    { label: 'Quatre événements', grade: 'CE1', params: { level: 3 } },
    { label: 'Cinq événements, des contes plus longs', grade: 'CE2', params: { level: 4 } },
  ]),

  generate({ rng, params }) {
    const count = LEVEL_RULES[params.level].events;
    const story = rng.pick(STORIES.filter((s) => s.level === params.level && s.events));
    const events = story.events!;
    // Quelques événements, dans l'ordre de l'histoire…
    const picked = rng
      .shuffle(events.map((_, i) => i))
      .slice(0, count)
      .sort((a, b) => a - b);
    // … montrés mélangés (jamais déjà rangés).
    let shown = rng.shuffle(picked);
    while (shown.every((e, k) => e === picked[k])) shown = rng.shuffle(picked);
    return {
      widget: 'comprehension',
      instruction: 'ÉCOUTE l’histoire, puis REMETS les événements dans l’ordre.',
      title: story.title,
      icon: story.icon,
      story: storyParagraphs(story).map((p) => p.map(typography)),
      items: [],
      events: shown.map((e) => ({
        text: typography(events[e]!.text),
        proof: proofSentences(story, events[e]!.proof)[0]!,
      })),
      data: { story: story.id, shown, order: picked.map((e) => shown.indexOf(e)) },
    };
  },

  solve: (q) => ({ selected: [], order: [...q.data.order] }),

  /** La première case fausse, avec la phrase de l'histoire où se passe l'événement attendu. */
  explain(q, answer) {
    const slot = q.data.order.findIndex((e, k) => answer.order?.[k] !== e);
    const event = q.events?.[q.data.order[slot] ?? -1];
    if (!event) return undefined;
    return `En ${slot + 1} : « ${event.text} » Dans l’histoire : « ${storySentences(q)[event.proof]} »`;
  },

  invariants(q, { params }) {
    const story = STORIES.find((s) => s.id === q.data.story);
    if (story?.level !== params.level) return 'histoire d’un autre niveau';
    const events = q.events ?? [];
    if (events.length !== LEVEL_RULES[params.level].events) return `${events.length} événements`;
    const proofs = q.data.order.map((e) => events[e]!.proof);
    if (proofs.some((p, k) => k > 0 && p <= proofs[k - 1]!)) return 'mauvais ordre attendu';
    if (q.data.order.every((e, k) => e === k)) return 'événements déjà rangés';
    return undefined;
  },

  // Une séance ne raconte pas deux fois la même histoire.
  signature: (q) => q.data.story,
  minVariety: MIN_STORIES_PER_LEVEL,
});
