import { checkAnswer, generateQuestion } from '@app/core';
import { describe, expect, it } from 'vitest';
import complete from '../calcul/complete-maison-12-13/plugin';
import range from '../calcul/range-maisons-12-13/plugin';
import relie from '../calcul/relie-maisons-12-13/plugin';
import { housePairs, houseTip, type House } from './maisons';

const SEEDS = Array.from({ length: 400 }, (_, i) => Math.imul(i + 1, 2654435761) >>> 0);
const evalSum = (text: string) => text.split(' + ').reduce((total, n) => total + Number(n), 0);

/** Toutes les égalités écrites dans une phrase (« 3 + 9 = 10 + 2 = 12 ») doivent être vraies. */
function falseEqualities(text: string): string[] {
  const chains = text.match(/\d+(?: \+ \d+)*(?: = \d+(?: \+ \d+)*)+/g) ?? [];
  return chains.filter((chain) => new Set(chain.split(' = ').map(evalSum)).size > 1);
}

describe('astuces des maisons', () => {
  const houses: House[] = [10, 11, 12, 13];
  const cases = houses.flatMap((house) =>
    housePairs(house).flatMap(([a, b]) => [
      { house, a, b },
      { house, a: b, b: a },
    ]),
  );

  it.each(cases)('$a + $b = $house : l’astuce dit vrai', ({ house, a, b }) => {
    const tip = houseTip(a, b);
    expect(tip.length).toBeGreaterThan(10);
    expect(falseEqualities(tip)).toEqual([]);
    // Un conseil sur le 12 ou le 13 ne parle pas de la maison du 10 ou du 11 à tort.
    if (house >= 12) expect(tip).not.toContain('maison du 10');
  });

  it('détecte une égalité fausse', () => {
    expect(falseEqualities('3 + 9 = 10 + 2 = 12')).toEqual([]);
    expect(falseEqualities('3 + 9 = 10')).toEqual(['3 + 9 = 10']);
  });
});

describe('maths.calcul.complete-maison-12-13', () => {
  complete.levels.forEach((_, i) => {
    const level = i + 1;
    it(`niveau ${level} : l’addition est juste et la maison est la bonne`, () => {
      const seen = new Set<string>();
      for (const seed of SEEDS) {
        const q = generateQuestion(complete, level, seed) as ReturnType<typeof complete.generate>;
        const { a, b, house, expected } = (
          q as { data: { a: number; b: number; house: House; expected: number } }
        ).data;
        const params = complete.levels[i]!.params;
        expect(params.houses).toContain(house);
        expect(a + b).toBe(house);
        // L'énoncé montre bien l'autre terme et le total, et cache celui qui manque.
        const prompt = (q as { prompt: string }).prompt;
        expect(prompt.match(/\{\?\}/g)).toHaveLength(1);
        const shown = prompt.replace('{?}', String(expected));
        const [left, right] = shown.split(' = ');
        const eq = /^\d+ \+ \d+$/.test(left!) ? [left!, right!] : [right!, left!];
        expect(evalSum(eq[0]!)).toBe(Number(eq[1]));
        expect(Number(eq[1])).toBe(house);
        // Un mauvais nombre est refusé, le bon accepté, l'explication est juste.
        expect(checkAnswer(complete, q, { value: String(expected + 1) }).correct).toBe(false);
        expect(checkAnswer(complete, q, { value: String(expected) }).correct).toBe(true);
        expect(falseEqualities(complete.explain!(q as never, { value: '99' }) ?? '')).toEqual([]);
        seen.add(`${house}:${Math.min(a, b)}`);
      }
      // Toutes les additions de la fiche sont proposées.
      const houses = complete.levels[i]!.params.houses;
      for (const h of houses) for (const [a] of housePairs(h)) expect(seen).toContain(`${h}:${a}`);
    });
  });
});

describe('maths.calcul.range-maisons-12-13', () => {
  range.levels.forEach((_, i) => {
    const level = i + 1;
    it(`niveau ${level} : chaque addition est dans la bonne maison`, () => {
      const { each, others } = range.levels[i]!.params;
      for (const seed of SEEDS) {
        const q = generateQuestion(range, level, seed) as {
          items: { text: string }[];
          categories: { id: string }[];
          data: { placed: string[] };
        };
        const texts = q.items.map((item) => item.text);
        expect(new Set(texts).size).toBe(texts.length);
        expect(q.categories.map((c) => c.id)).toEqual(
          others ? ['12', '13', 'autre'] : ['12', '13'],
        );
        q.items.forEach((item, k) => {
          const total = evalSum(item.text);
          const expected = total === 12 ? '12' : total === 13 ? '13' : 'autre';
          expect(q.data.placed[k]).toBe(expected);
          if (!others) expect(total === 12 || total === 13).toBe(true);
          else if (expected === 'autre') expect([11, 14]).toContain(total);
        });
        for (const place of others ? ['12', '13', 'autre'] : ['12', '13'])
          expect(q.data.placed.filter((p) => p === place)).toHaveLength(each);
        // Toutes les additions rangées au mauvais endroit sont refusées, et expliquées juste.
        const swapped = q.data.placed.map((p) => (p === '12' ? '13' : '12'));
        expect(checkAnswer(range, q as never, { placed: swapped }).correct).toBe(false);
        const text = range.explain!(q as never, { placed: swapped }) ?? '';
        expect(falseEqualities(text)).toEqual([]);
        expect(text).toMatch(/= (11|12|13|14)/);
      }
    });
  });
});

describe('maths.calcul.relie-maisons-12-13', () => {
  relie.levels.forEach((_, i) => {
    const level = i + 1;
    it(`niveau ${level} : chaque trait relie deux nombres qui font la maison`, () => {
      const { count, houses } = relie.levels[i]!.params;
      for (const seed of SEEDS) {
        const q = generateQuestion(relie, level, seed) as {
          columns: { cards: { text: string }[] }[];
          data: { house: House; links: number[]; left: number[] };
        };
        const { house, links, left } = q.data;
        expect(houses).toContain(house);
        expect(left).toHaveLength(count);
        expect(new Set(left).size).toBe(count);
        const right = q.columns[1]!.cards.map((card) => Number(card.text));
        expect(new Set(right).size).toBe(count);
        left.forEach((a, k) => {
          expect(a).toBeGreaterThanOrEqual(0);
          expect(a).toBeLessThanOrEqual(house);
          expect(q.columns[0]!.cards[k]!.text).toBe(`${a} +`);
          expect(a + right[links[k]!]!).toBe(house);
        });
        // Deux traits échangés : refusé, et l'explication porte sur une paire juste.
        const wrong = [...links];
        [wrong[0], wrong[1]] = [wrong[1]!, wrong[0]!];
        expect(checkAnswer(relie, q as never, { links: [wrong] }).correct).toBe(false);
        expect(falseEqualities(relie.explain!(q as never, { links: [wrong] }) ?? '')).toEqual([]);
      }
    });
  });
});
