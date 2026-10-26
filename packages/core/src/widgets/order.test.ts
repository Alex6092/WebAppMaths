import { describe, expect, it } from 'vitest';
import type { OrderQuestion } from '../question';
import { compareOrder, orderText, orderWidget } from './order';

// « Le chat boit le lait . », mélangé : 0 lait, 1 Le, 2 boit, 3 ., 4 le, 5 chat
const q: OrderQuestion = {
  widget: 'order',
  instruction: 'REMETS les mots dans l’ordre.',
  tiles: [
    { text: 'lait' },
    { text: 'Le' },
    { text: 'boit' },
    { text: '.', glue: true },
    { text: 'le' },
    { text: 'chat' },
  ],
};
const good = [1, 5, 2, 4, 0, 3];

describe('order', () => {
  it('reconstitue le texte, ponctuation collée', () => {
    expect(orderText(q, good)).toBe('Le chat boit le lait.');
  });

  it('juste seulement quand tout est posé dans le bon ordre', () => {
    expect(orderWidget.compare(q, { order: good }, { order: good }).correct).toBe(true);
    expect(orderWidget.isComplete(q, { order: good.slice(0, 5) })).toBe(false);
    const wrong = orderWidget.compare(q, { order: good }, { order: [1, 0, 2, 4, 5, 3] });
    expect(wrong.correct).toBe(false);
    expect(wrong.marks).toMatchObject({
      0: 'ok',
      1: 'wrong',
      2: 'ok',
      3: 'ok',
      4: 'wrong',
      5: 'ok',
    });
    expect(wrong.score).toBeCloseTo(4 / 6);
  });

  it('accepte un autre ordre admis par l’exercice', () => {
    const tiles: OrderQuestion = {
      ...q,
      tiles: [{ text: 'Léa' }, { text: 'joue' }, { text: 'demain' }, { text: 'dehors' }],
    };
    const accepted = [
      [0, 1, 3, 2],
      [0, 1, 2, 3],
    ];
    expect(compareOrder(tiles, accepted, { order: [0, 1, 2, 3] }).correct).toBe(true);
    expect(compareOrder(tiles, accepted, { order: [0, 1, 3, 2] }).correct).toBe(true);
    expect(compareOrder(tiles, accepted, { order: [1, 0, 3, 2] }).correct).toBe(false);
  });

  it('au deuxième essai, garde le début juste', () => {
    const given = { order: [1, 5, 4, 2, 0, 3] };
    const result = orderWidget.compare(q, { order: good }, given);
    expect(orderWidget.retryAnswer(q, given, result)).toEqual({ order: [1, 5] });
  });

  it('refuse une réponse mal formée', () => {
    expect(orderWidget.validate(q, { order: [0, 0] })).toBe(false);
    expect(orderWidget.validate(q, { order: [9] })).toBe(false);
    expect(orderWidget.validate(q, { order: [3, 1] })).toBe(true);
  });
});
