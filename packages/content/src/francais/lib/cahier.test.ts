import { checkAnswer, generateQuestion, orderText, type OrderQuestion } from '@app/core';
import { describe, expect, it } from 'vitest';
import { registry } from '../../index';
import { FOODS } from '../../qlm/lib/aliments';
import { FAMILIES, familyWords } from './familles';

describe('leçons du cahier', () => {
  it('une phrase qui finit par un indicateur l’accepte aussi juste après le verbe', () => {
    const plugin = registry.plugin('francais.grammaire.remets-ordre')!;
    let checked = 0;
    for (let seed = 1; seed < 300 && checked < 20; seed++) {
      const q = generateQuestion(plugin, 3, seed) as OrderQuestion & {
        data: { order: number[]; alt: number[] | null; text: string };
      };
      if (!q.data.alt) continue;
      checked++;
      expect(checkAnswer(plugin, q, { order: q.data.alt }).correct).toBe(true);
      expect(orderText(q, q.data.alt)).not.toBe(q.data.text);
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('un mot n’appartient qu’à une seule famille', () => {
    const all = FAMILIES.flatMap(familyWords);
    expect(new Set(all).size).toBe(all.length);
  });

  it('chaque aliment a un nom et une icône uniques', () => {
    expect(new Set(FOODS.map((f) => f.name)).size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => f.icon)).size).toBe(FOODS.length);
  });
});
