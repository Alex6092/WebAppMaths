import { describe, expect, it } from 'vitest';
import type { ComprehensionQuestion } from '../question';
import { comprehensionWidget, itemSpeech, storySentences } from './comprehension';

const choices = (...labels: string[]) => labels.map((label, i) => ({ id: 'abc'[i]!, label }));

const story: ComprehensionQuestion = {
  widget: 'comprehension',
  instruction: 'ÉCOUTE l’histoire, puis RÉPONDS aux questions.',
  title: 'Le cerf-volant de Lila',
  story: [['Lila a un cerf-volant rouge.', 'Il y a du vent.'], ['Un écureuil l’aide.']],
  items: [
    { ask: 'De quelle couleur est le cerf-volant ?', choices: choices('bleu', 'rouge'), proof: 0 },
    { ask: 'Qui aide Lila ?', choices: choices('un écureuil', 'un oiseau', 'un chat'), proof: 2 },
  ],
};
const expected = { selected: ['b', 'a'] };

describe('écouter une histoire', () => {
  it('attend un choix par question', () => {
    const empty = comprehensionWidget.emptyAnswer(story);
    expect(empty).toEqual({ selected: ['', ''] });
    expect(comprehensionWidget.isComplete(story, empty)).toBe(false);
    expect(comprehensionWidget.isComplete(story, { selected: ['b', ''] })).toBe(false);
    expect(comprehensionWidget.isComplete(story, expected)).toBe(true);
  });

  it('refuse un choix qui n’existe pas, ou un nombre de réponses différent', () => {
    expect(comprehensionWidget.validate(story, expected)).toBe(true);
    expect(comprehensionWidget.validate(story, { selected: ['b', ''] })).toBe(true);
    expect(comprehensionWidget.validate(story, { selected: ['c', 'a'] })).toBe(false);
    expect(comprehensionWidget.validate(story, { selected: ['b'] })).toBe(false);
    expect(comprehensionWidget.validate(story, { selected: [1, 'a'] })).toBe(false);
    expect(comprehensionWidget.validate(story, null)).toBe(false);
  });

  it('corrige question par question', () => {
    expect(comprehensionWidget.compare(story, expected, expected)).toEqual({
      correct: true,
      score: 1,
      marks: { 0: 'ok', 1: 'ok' },
    });
    const half = comprehensionWidget.compare(story, expected, { selected: ['b', 'c'] });
    expect(half).toMatchObject({ correct: false, score: 0.5, marks: { 0: 'ok', 1: 'wrong' } });
    expect(half.feedback).toMatch(/Réécoute/);
    const read = { ...story, read: true };
    expect(comprehensionWidget.compare(read, expected, { selected: ['b', 'c'] }).feedback).toMatch(
      /Relis le texte/,
    );
  });

  it('garde les bonnes réponses pour le deuxième essai', () => {
    const result = comprehensionWidget.compare(story, expected, { selected: ['a', 'a'] });
    expect(comprehensionWidget.retryAnswer(story, { selected: ['a', 'a'] }, result)).toEqual({
      selected: ['', 'a'],
    });
  });

  it('dit la question avec ses choix', () => {
    expect(itemSpeech(story.items[1]!)).toBe('Qui aide Lila ? un écureuil, un oiseau ou un chat ?');
    expect(itemSpeech(story.items[0]!)).toBe(
      'De quelle couleur est le cerf-volant ? bleu ou rouge ?',
    );
  });

  it('numérote les phrases à la suite, d’un paragraphe à l’autre', () => {
    expect(storySentences(story)[2]).toBe('Un écureuil l’aide.');
  });
});
