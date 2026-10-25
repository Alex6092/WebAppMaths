import { describe, expect, it } from 'vitest';
import type { ClassifyQuestion, FillBlankQuestion, WordSelectQuestion } from '../question';
import { matchText, normalizeText } from '../text';
import { classifyWidget } from './classify';
import { blankParts, compareBlanks, fillBlankWidget } from './fill-blank';
import { tokensText, wordSelectWidget } from './word-select';

describe('texte tapé', () => {
  it('normalise espaces, apostrophes et majuscules', () => {
    expect(normalizeText('  Aujourd’hui  ')).toBe("aujourd'hui");
    expect(normalizeText('J ’ aime')).toBe("j'aime");
    expect(normalizeText('Demain', true)).toBe('Demain');
  });

  it('distingue une erreur d’accent', () => {
    expect(matchText(['répéter'], 'Répéter')).toBe('ok');
    expect(matchText(['répéter'], 'repeter')).toBe('accent');
    expect(matchText(['répéter'], 'répété')).toBe('wrong');
    expect(matchText(['répéter'], '  ')).toBe('missing');
    expect(matchText(['répétera', 'répètera'], 'répètera')).toBe('ok');
  });
});

describe('fill-blank', () => {
  const q: FillBlankQuestion = {
    widget: 'fill-blank',
    instruction: 'COMPLÈTE',
    prompt: '{0}, Tom {1} un film.',
    blanks: [{ kind: 'choice', options: ['Hier', 'Demain'] }, { kind: 'text' }],
  };

  it('découpe l’énoncé', () => {
    expect(blankParts(q.prompt)).toEqual([0, ', Tom ', 1, ' un film.']);
  });

  it('corrige trou par trou et signale les accents', () => {
    const r = compareBlanks(q, [['Demain'], ['regardera']], { values: ['Demain', 'régardera'] });
    expect(r).toMatchObject({ correct: false, score: 0.5, marks: { 0: 'ok', 1: 'near' } });
    expect(r.feedback).toMatch(/accents/);
    expect(fillBlankWidget.retryAnswer(q, { values: ['Demain', 'régardera'] }, r).values).toEqual([
      'Demain',
      'régardera',
    ]);
  });

  it('refuse une étiquette qui n’est pas proposée', () => {
    expect(fillBlankWidget.validate(q, { values: ['Jadis', 'x'] })).toBe(false);
    expect(fillBlankWidget.validate(q, { values: ['', 'x'] })).toBe(true);
    expect(fillBlankWidget.isComplete(q, { values: ['Hier', ' '] })).toBe(false);
  });
});

describe('word-select et classify', () => {
  const ws: WordSelectQuestion = {
    widget: 'word-select',
    instruction: 'SOULIGNE',
    layout: 'sentence',
    mark: 'underline',
    tokens: [
      { text: "J'" },
      { text: 'aime', glue: true },
      { text: 'les' },
      { text: 'pommes' },
      { text: '.', glue: true, selectable: false },
    ],
    colors: [{ id: 'x', label: 'souligné', color: 'red' }],
  };

  it('reconstitue la phrase', () => {
    expect(tokensText(ws)).toBe("J'aime les pommes.");
  });

  it('corrige mot par mot et garde ce qui est juste', () => {
    const expected = { picks: [null, 'x', null, null, null] };
    const given = { picks: [null, 'x', 'x', null, null] };
    const r = wordSelectWidget.compare(ws, expected, given);
    expect(r).toMatchObject({ correct: false, score: 0, marks: { 1: 'ok', 2: 'wrong' } });
    expect(wordSelectWidget.retryAnswer(ws, given, r).picks).toEqual([null, 'x', null, null, null]);
    expect(wordSelectWidget.validate(ws, { picks: [null, null, null, null, 'x'] })).toBe(false);
  });

  it('exige que toutes les étiquettes soient rangées', () => {
    const cq: ClassifyQuestion = {
      widget: 'classify',
      instruction: 'RANGE',
      layout: 'columns',
      items: [{ text: 'hier' }, { text: 'demain' }],
      categories: [
        { id: 'passe', label: 'passé' },
        { id: 'futur', label: 'futur' },
      ],
    };
    expect(classifyWidget.isComplete(cq, { placed: ['passe', null] })).toBe(false);
    expect(classifyWidget.validate(cq, { placed: ['passe', 'present'] })).toBe(false);
    expect(
      classifyWidget.compare(cq, { placed: ['passe', 'futur'] }, { placed: ['passe', 'passe'] }),
    ).toMatchObject({ correct: false, score: 0, marks: { 0: 'ok', 1: 'wrong' } });
  });
});
