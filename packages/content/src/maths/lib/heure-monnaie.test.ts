import {
  checkAnswer,
  fewestCoins,
  type FillBlankQuestion,
  generateQuestion,
  type MoneyQuestion,
  type McqQuestion,
} from '@app/core';
import { describe, expect, it } from 'vitest';
import { registry } from '../../index';
import { timeInWords } from './heure';

describe('l’heure', () => {
  it('dit les quarts et les demies comme à l’oral', () => {
    expect(timeInWords(60)).toBe('une heure pile');
    expect(timeInWords(195)).toBe('trois heures et quart');
    expect(timeInWords(210)).toBe('trois heures et demie');
    expect(timeInWords(225)).toBe('quatre heures moins le quart');
  });

  it('accepte « 5 » et « 05 », et 15 h pour 3 h le matin', () => {
    const plugin = registry.plugin('maths.mesures.lis-heure')!;
    const q = generateQuestion(plugin, 4, 7) as FillBlankQuestion & { data: { minutes: number } };
    const m = q.data.minutes % 60;
    const h = Math.floor(q.data.minutes / 60) || 12;
    expect(checkAnswer(plugin, q, { values: [String(h), String(m)] }).correct).toBe(true);
    expect(
      checkAnswer(plugin, q, { values: [String(h + 12), String(m).padStart(2, '0')] }).correct,
    ).toBe(h !== 12);
  });

  it('propose des horloges toutes différentes', () => {
    const plugin = registry.plugin('maths.mesures.quelle-horloge')!;
    for (let level = 1; level <= plugin.levels.length; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const q = generateQuestion(plugin, level, seed) as McqQuestion;
        const times = q.choices.map((c) => (c.picture?.kind === 'clock' ? c.picture.minutes : -1));
        expect(new Set(times).size).toBe(3);
      }
    }
  });
});

describe('la monnaie', () => {
  it('« le moins de pièces » laisse toujours une autre façon de payer, plus longue', () => {
    const plugin = registry.plugin('maths.mesures.moins-de-pieces')!;
    for (let level = 1; level <= plugin.levels.length; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const q = generateQuestion(plugin, level, seed) as MoneyQuestion & {
          data: { price: number; pay: number[] };
        };
        const best = fewestCoins(q.data.price);
        expect(q.data.pay).toHaveLength(best.length);
        // Payer avec la monnaie qui remplace un billet : la somme est juste, mais c'est plus long.
        const longer = longerPayment(q.purse, q.data.price);
        expect(longer).not.toBeNull();
        const result = checkAnswer(plugin, q, { picked: longer! });
        expect(result.correct).toBe(false);
        expect(result.score).toBe(0.5);
      }
    }
  });
});

/** Une façon de payer price avec plus de pièces que le minimum (ou null). */
function longerPayment(purse: readonly number[], price: number): number[] | null {
  const minimum = fewestCoins(price).length;
  const search = (i: number, rest: number, picked: number[]): number[] | null => {
    if (rest === 0) return picked.length > minimum ? picked : null;
    if (i >= purse.length || rest < 0) return null;
    return search(i + 1, rest - purse[i]!, [...picked, i]) ?? search(i + 1, rest, picked);
  };
  return search(0, price, []);
}
