import { describe, expect, it } from 'vitest';
import { numberToWords, withoutHyphens, withoutPlural } from './lettres';

describe('nombres en lettres (orthographe traditionnelle)', () => {
  it.each([
    [0, 'zéro'],
    [7, 'sept'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [21, 'vingt et un'],
    [22, 'vingt-deux'],
    [60, 'soixante'],
    [70, 'soixante-dix'],
    [71, 'soixante et onze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [90, 'quatre-vingt-dix'],
    [91, 'quatre-vingt-onze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent un'],
    [200, 'deux cents'],
    [201, 'deux cent un'],
    [280, 'deux cent quatre-vingts'],
    [281, 'deux cent quatre-vingt-un'],
    [347, 'trois cent quarante-sept'],
    [571, 'cinq cent soixante et onze'],
    [999, 'neuf cent quatre-vingt-dix-neuf'],
    [1000, 'mille'],
  ])('%i → %s', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it('repère les erreurs de traits d’union et de pluriel', () => {
    expect(withoutHyphens('deux-cent-trente-et-un')).toBe(withoutHyphens('deux cent trente et un'));
    expect(withoutPlural('deux cent')).toBe(withoutPlural('deux cents'));
    expect(withoutPlural('quatre vingt')).toBe(withoutPlural('quatre-vingts'));
  });
});
