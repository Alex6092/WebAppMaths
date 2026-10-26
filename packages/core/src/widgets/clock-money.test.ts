import { describe, expect, it } from 'vitest';
import { clockText, dialHour, handAngles, onDial } from '../clock';
import { denominationLabel, fewestCoins, moneySpeech, moneyText } from '../money';
import type { ClockQuestion, MoneyQuestion } from '../question';
import { clockWidget } from './clock';
import { moneyWidget } from './money';

describe('horloge', () => {
  it('écrit l’heure comme à l’école', () => {
    expect(clockText(180)).toBe('3 h');
    expect(clockText(185)).toBe('3 h 05');
    expect(clockText(30)).toBe('12 h 30');
    expect(clockText(185, true)).toBe('15 h 05');
    expect(dialHour(0)).toBe(12);
    expect(onDial(-15)).toBe(705);
  });

  it('place la petite aiguille entre deux nombres', () => {
    expect(handAngles(210)).toEqual({ hour: 105, minute: 180 });
  });

  const q: ClockQuestion = {
    widget: 'clock',
    instruction: 'PLACE les aiguilles.',
    prompt: '3 h 30',
    step: 30,
    start: 0,
  };

  it('corrige chaque aiguille, l’après-midi comme le matin', () => {
    const want = { minutes: 210 };
    expect(clockWidget.compare(q, want, { minutes: 210 }).correct).toBe(true);
    const hourWrong = clockWidget.compare(q, want, { minutes: 270 });
    expect(hourWrong.marks).toEqual({ minute: 'ok', hour: 'wrong' });
    expect(hourWrong.feedback).toContain('petite');
    const minuteWrong = clockWidget.compare(q, want, { minutes: 195 });
    expect(minuteWrong.marks).toEqual({ minute: 'wrong', hour: 'ok' });
  });

  it('n’envoie pas les aiguilles qu’on n’a pas bougées', () => {
    expect(clockWidget.isComplete(q, clockWidget.emptyAnswer(q))).toBe(false);
    expect(clockWidget.validate(q, { minutes: 720 })).toBe(false);
    expect(clockWidget.validate(q, { minutes: 12.5 })).toBe(false);
  });
});

describe('monnaie', () => {
  it('écrit les sommes sans virgule', () => {
    expect(moneyText(1700)).toBe('17 €');
    expect(moneyText(350)).toBe('3 € 50 c');
    expect(moneyText(80)).toBe('80 c');
    expect(moneySpeech(105)).toBe('1 euro et 5 centimes');
    expect(denominationLabel(2000)).toBe('20 €');
    expect(denominationLabel(50)).toBe('50 c');
  });

  it('paie avec le moins de pièces et de billets', () => {
    expect(fewestCoins(1700)).toEqual([1000, 500, 200]);
    expect(fewestCoins(845)).toEqual([500, 200, 100, 20, 20, 5]);
    expect(fewestCoins(1000, [500, 200, 100])).toEqual([500, 500]);
    expect(() => fewestCoins(150, [100, 200])).toThrow();
  });

  const q: MoneyQuestion = {
    widget: 'money',
    instruction: 'ENTOURE l’argent pour payer.',
    prompt: 'La glace coûte 7 €.',
    purse: [500, 200, 200, 100, 100, 100],
  };

  it('accepte toute façon de payer la bonne somme', () => {
    const want = { picked: [0, 1] };
    expect(moneyWidget.compare(q, want, { picked: [0, 3, 4] }).correct).toBe(true);
    expect(moneyWidget.compare(q, want, { picked: [1, 2, 3, 4, 5] }).correct).toBe(true);
    expect(moneyWidget.compare(q, want, { picked: [0] }).feedback).toContain('pas assez');
    expect(moneyWidget.compare(q, want, { picked: [0, 1, 2] }).feedback).toContain('trop');
  });

  it('refuse une pièce entourée deux fois ou hors du porte-monnaie', () => {
    expect(moneyWidget.validate(q, { picked: [0, 0] })).toBe(false);
    expect(moneyWidget.validate(q, { picked: [6] })).toBe(false);
    expect(moneyWidget.isComplete(q, { picked: [] })).toBe(false);
  });
});
