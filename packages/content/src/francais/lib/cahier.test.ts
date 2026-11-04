import {
  checkAnswer,
  generateQuestion,
  orderText,
  type OrderQuestion,
  type WordSelectQuestion,
} from '@app/core';
import { describe, expect, it } from 'vitest';
import { registry } from '../../index';
import { FOODS } from '../../qlm/lib/aliments';
import { commonPart, FAMILIES, familyWords } from './familles';

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

  it('le radical est la plus grande partie commune des mots de sa famille', () => {
    for (const f of FAMILIES.filter((f) => f.radical)) {
      expect(commonPart(familyWords(f)), f.base).toBe(f.radical);
    }
  });

  it('un mot piège n’est pas de la famille qu’il piège', () => {
    const all = new Set(FAMILIES.flatMap(familyWords));
    for (const f of FAMILIES) {
      // Un mot qui se ressemble n'est d'aucune famille : il ne doit jamais être une bonne réponse.
      for (const w of f.lookalikes ?? []) expect(all.has(w), `${f.base} : ${w}`).toBe(false);
      for (const w of f.theme ?? []) expect(familyWords(f), f.base).not.toContain(w);
    }
  });

  it('deux familles mélangées : les deux coloriages sont justes', () => {
    const plugin = registry.plugin('francais.vocabulaire.deux-familles')!;
    for (let seed = 1; seed < 50; seed++) {
      const q = generateQuestion(plugin, 1, seed);
      const picks = (q as WordSelectQuestion & { data: { groups: string[] } }).data.groups;
      const swapped = picks.map((p) => (p === 'a' ? 'b' : 'a'));
      expect(checkAnswer(plugin, q, { picks: swapped }).correct).toBe(true);
      // Une famille coupée en deux couleurs est fausse.
      const broken = [...picks];
      broken[0] = broken[0] === 'a' ? 'b' : 'a';
      expect(checkAnswer(plugin, q, { picks: broken }).correct).toBe(false);
    }
  });

  it('chaque aliment a un nom et une icône uniques', () => {
    expect(new Set(FOODS.map((f) => f.name)).size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => f.icon)).size).toBe(FOODS.length);
  });
});
