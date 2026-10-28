import { generateQuestion, storySentences, type QuestionOf } from '@app/core';
import { describe, expect, it } from 'vitest';
import {
  MAX_SENTENCE,
  MIN_STORIES_PER_LEVEL,
  proofSentences,
  storyChoice,
  storyParagraphs,
} from '../../../francais/lib/histoires';
import plugin from '../../ecoute/histoires/plugin';
import { ENGLISH_RULES, ENGLISH_STORIES, englishSpeechTexts, type EnglishLevel } from './index';

describe.each(ENGLISH_STORIES.map((story) => ({ story, id: story.id })))(
  'histoire $id',
  ({ story }) => {
    const rules = ENGLISH_RULES[story.level];
    const sentences = storyParagraphs(story).flat();

    it('a la longueur de son niveau, en phrases que la voix dit d’un trait', () => {
      const length = story.text.join(' ').length;
      expect(length).toBeGreaterThanOrEqual(rules.minChars);
      expect(length).toBeLessThanOrEqual(rules.maxChars);
      expect(sentences.filter((s) => s.length > MAX_SENTENCE)).toEqual([]);
    });

    it('a sa traduction, paragraphe par paragraphe', () => {
      expect(story.translation).toHaveLength(story.text.length);
    });

    it('a assez de questions, chacune avec la seule phrase qui donne la réponse', () => {
      expect(story.questions.length).toBeGreaterThanOrEqual(rules.questions + 2);
      const errors = story.questions.flatMap((q) => {
        const found = proofSentences(story, q.proof);
        return found.length === 1 ? [] : [`« ${q.proof} » : ${found.length} phrases`];
      });
      expect(errors).toEqual([]);
    });

    it('propose trois réponses différentes, toutes en images', () => {
      for (const q of story.questions) {
        if ('claim' in q) continue;
        const labels = [q.answer, ...q.wrong];
        expect(q.wrong).toHaveLength(2);
        expect(new Set(labels.map((l) => storyChoice(l, '').label)).size).toBe(3);
        expect(labels.every((l) => storyChoice(l, '').icon)).toBe(true);
      }
    });
  },
);

it('a assez d’histoires à chaque niveau, et un identifiant différent pour chacune', () => {
  for (const level of [1, 2] as EnglishLevel[]) {
    const count = ENGLISH_STORIES.filter((s) => s.level === level).length;
    expect(count, `niveau ${level}`).toBeGreaterThanOrEqual(MIN_STORIES_PER_LEVEL);
  }
  const ids = ENGLISH_STORIES.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('donne au serveur, à préparer d’avance, les phrases mêmes que l’exercice fait dire', () => {
  const prepared = new Set(englishSpeechTexts());
  for (let level = 1; level <= plugin.levels.length; level++) {
    for (let seed = 1; seed <= 20; seed++) {
      const q = generateQuestion(plugin, level, seed) as QuestionOf<'comprehension'>;
      expect(q.lang).toBe('en-GB');
      expect(storySentences(q).filter((s) => !prepared.has(s))).toEqual([]);
    }
  }
});
