import { describe, expect, it } from 'vitest';
import type { MatchQuestion } from '../question';
import { compareMatch, linkKey, matchWidget } from './match';

const cards = (...texts: string[]) => texts.map((text) => ({ text }));

const three: MatchQuestion = {
  widget: 'match',
  instruction: 'RELIE chaque énoncé à sa question et à sa phrase-réponse.',
  columns: [
    { title: 'énoncés', cards: cards('E0', 'E1') },
    { title: 'questions', cards: cards('Q0', 'Q1') },
    { title: 'phrases-réponses', cards: cards('R0', 'R1') },
  ],
};
const expected = {
  links: [
    [1, 0],
    [0, 1],
  ],
};

describe('relier', () => {
  it('attend un trait par carte, sauf dans la dernière colonne', () => {
    const empty = matchWidget.emptyAnswer(three);
    expect(empty).toEqual({
      links: [
        [null, null],
        [null, null],
      ],
    });
    expect(matchWidget.isComplete(three, empty)).toBe(false);
    expect(matchWidget.isComplete(three, expected)).toBe(true);
  });

  it('refuse deux traits vers la même carte, ou une carte qui n’existe pas', () => {
    expect(matchWidget.validate(three, expected)).toBe(true);
    expect(
      matchWidget.validate(three, {
        links: [
          [1, 1],
          [0, 1],
        ],
      }),
    ).toBe(false);
    expect(
      matchWidget.validate(three, {
        links: [
          [2, 0],
          [0, 1],
        ],
      }),
    ).toBe(false);
    expect(matchWidget.validate(three, { links: [[1, 0]] })).toBe(false);
  });

  it('corrige trait par trait et garde les bons au deuxième essai', () => {
    const given = {
      links: [
        [1, 0],
        [1, 0],
      ],
    };
    const result = matchWidget.compare(three, expected, given);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0.5);
    expect(result.marks[linkKey(0, 0)]).toBe('ok');
    expect(result.marks[linkKey(1, 0)]).toBe('wrong');
    expect(matchWidget.retryAnswer(three, given, result)).toEqual({
      links: [
        [1, 0],
        [null, null],
      ],
    });
  });

  it('accepte deux cartes interchangeables', () => {
    // Deux fins de phrase au futur : relier l'une ou l'autre est juste.
    const want = { links: [[0, 1, 2]] };
    const given = { links: [[1, 0, 2]] };
    expect(compareMatch(want, given).correct).toBe(false);
    expect(compareMatch(want, given, (_c, a, b) => a < 2 && b < 2).correct).toBe(true);
  });
});
