import { generateQuestion, storySentences, type QuestionOf } from '@app/core';
import { describe, expect, it } from 'vitest';
import plugin from '../../oral/histoires/plugin';
import ordre from '../../oral/ordre-histoire/plugin';
import {
  isWhy,
  LEVEL_RULES,
  MAX_EVENT,
  MAX_SENTENCE,
  MIN_STORIES_PER_LEVEL,
  proofSentences,
  splitSentences,
  STORIES,
  storyChoice,
  storyParagraphs,
  storySpeechTexts,
  type StoryLevel,
} from './index';

describe('découpage des histoires', () => {
  it('coupe après la ponctuation, devant une majuscule ou un guillemet', () => {
    expect(
      splitSentences(
        'Tout à coup, le fil casse ! Le cerf-volant s’envole. « Quelqu’un a mangé ma soupe ! » pleure le bébé ours. Et voilà… la fin.',
      ),
    ).toEqual([
      'Tout à coup, le fil casse !',
      'Le cerf-volant s’envole.',
      '« Quelqu’un a mangé ma soupe ! » pleure le bébé ours.',
      'Et voilà… la fin.',
    ]);
    expect(
      splitSentences('Elle demandait : « Qui est la plus belle ? » Et le miroir répondait.'),
    ).toEqual(['Elle demandait : « Qui est la plus belle ? »', 'Et le miroir répondait.']);
  });

  it('prend l’emoji du début comme image du choix', () => {
    expect(storyChoice('🐿️ un écureuil', 'a')).toEqual({
      id: 'a',
      label: 'un écureuil',
      icon: '🐿️',
    });
    expect(storyChoice('La soupe est trop chaude.', 'b')).toEqual({
      id: 'b',
      label: 'La soupe est trop chaude.',
    });
  });
});

describe.each(STORIES.map((story) => ({ story, id: story.id })))('histoire $id', ({ story }) => {
  const rules = LEVEL_RULES[story.level];
  const sentences = storyParagraphs(story).flat();

  it('a la longueur de son niveau, en phrases que la voix dit d’un trait', () => {
    const length = story.text.join(' ').length;
    expect(length).toBeGreaterThanOrEqual(rules.minChars);
    expect(length).toBeLessThanOrEqual(rules.maxChars);
    expect(sentences.filter((s) => s.length > MAX_SENTENCE)).toEqual([]);
  });

  it('a assez de questions pour en changer d’une fois à l’autre', () => {
    expect(story.questions.length).toBeGreaterThanOrEqual(rules.questions + 2);
    if (rules.why) expect(story.questions.some(isWhy)).toBe(true);
  });

  it('montre, pour chaque question, la seule phrase qui donne la réponse', () => {
    const errors = story.questions.flatMap((q) => {
      const found = proofSentences(story, q.proof);
      return found.length === 1 ? [] : [`« ${q.proof} » : ${found.length} phrases`];
    });
    expect(errors).toEqual([]);
  });

  it('propose trois réponses différentes, avec une image au CP', () => {
    for (const q of story.questions) {
      if ('claim' in q) {
        expect(rules.pictures, `vrai ou faux au niveau ${story.level}`).toBe(false);
        continue;
      }
      const labels = [q.answer, ...q.wrong];
      expect(q.wrong).toHaveLength(2);
      expect(new Set(labels.map((l) => storyChoice(l, '').label)).size).toBe(3);
      if (rules.pictures) expect(labels.every((l) => storyChoice(l, '').icon)).toBe(true);
    }
  });

  it('a, au CE1 et au CE2, des événements à ranger, chacun dans sa phrase', () => {
    const events = story.events ?? [];
    if (!rules.events) return expect(events).toEqual([]);
    expect(events.length).toBeGreaterThanOrEqual(rules.events + 2);
    expect(events.filter((e) => e.text.length > MAX_EVENT)).toEqual([]);
    expect(new Set(events.map((e) => e.text)).size).toBe(events.length);
    const errors = events.flatMap((e) => {
      const found = proofSentences(story, e.proof);
      return found.length === 1 ? [] : [`« ${e.proof} » : ${found.length} phrases`];
    });
    expect(errors).toEqual([]);
    // Dans l'ordre de l'histoire, chacun dans une phrase différente.
    const at = events.map((e) => proofSentences(story, e.proof)[0]!);
    expect(at.every((p, k) => k === 0 || p > at[k - 1]!)).toBe(true);
  });
});

it('a assez d’histoires à chaque niveau, et un identifiant différent pour chacune', () => {
  for (const level of Object.keys(LEVEL_RULES).map(Number) as StoryLevel[]) {
    const count = STORIES.filter((s) => s.level === level).length;
    expect(count, `niveau ${level}`).toBeGreaterThanOrEqual(MIN_STORIES_PER_LEVEL);
  }
  const ids = STORIES.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('donne au serveur, à préparer d’avance, les phrases mêmes que l’exercice fait dire', () => {
  const prepared = new Set(storySpeechTexts());
  for (const p of [plugin, ordre]) {
    for (let level = 1; level <= p.levels.length; level++) {
      for (let seed = 1; seed <= 20; seed++) {
        const q = generateQuestion(p, level, seed) as QuestionOf<'comprehension'>;
        const said = [...storySentences(q), ...(q.events ?? []).map((e) => e.text)];
        expect(said.filter((s) => !prepared.has(s))).toEqual([]);
      }
    }
  }
});
