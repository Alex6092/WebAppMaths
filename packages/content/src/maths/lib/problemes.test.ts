import { createRng } from '@app/core';
import { describe, expect, it } from 'vitest';
import {
  ALL_KINDS,
  de,
  fill,
  makeProblem,
  ofArticle,
  que,
  SCENES,
  the,
  thisPlace,
  type Problem,
} from './problemes';

const compute = (p: Problem) => {
  const [a, b] = p.operands;
  return p.op === '+' ? a + b : p.op === '−' ? a - b : a * b;
};

describe('problèmes générés', () => {
  it('élident devant une voyelle, pas devant un y', () => {
    expect(de('élèves')).toBe('d’élèves');
    expect(de('œufs')).toBe('d’œufs');
    expect(de('yaourts')).toBe('de yaourts');
    expect(que('Etan')).toBe('qu’Etan');
    expect(que('Léa')).toBe('que Léa');
  });

  it('accordent les lieux : du jardin, de la classe, de l’étagère, cet aquarium', () => {
    const place = (noun: string) => SCENES.flatMap((s) => s.places).find((p) => p.noun === noun)!;
    expect(ofArticle(place('jardin'))).toBe('du ');
    expect(ofArticle(place('classe'))).toBe('de la ');
    expect(the(place('étagère'))).toBe('l’étagère');
    expect(thisPlace(place('aquarium'))).toBe('cet aquarium');
    expect(thisPlace(place('valise'))).toBe('cette valise');
  });

  it('tiennent leurs comptes, et aucune phrase-réponse fausse n’est la bonne', () => {
    for (const kind of ALL_KINDS) {
      for (let seed = 0; seed < 300; seed++) {
        const p = makeProblem(createRng(seed), kind, { kinds: [kind], max: 100, carry: true });
        expect(compute(p), `${kind} ${seed}`).toBe(p.result);
        expect(p.result).toBeGreaterThanOrEqual(2);
        expect(p.result).toBeLessThanOrEqual(100);
        expect(p.question.endsWith(' ?')).toBe(true);
        expect(p.wrongReplies).not.toContain(fill(p.reply, p.result));
        expect(p.wrongReplies.length).toBeGreaterThanOrEqual(2);
        expect(p.statement.join(' ')).not.toMatch(/\bque [AEIOUÉ]/);
      }
    }
  });

  it('sans retenue, les unités ne dépassent pas 9', () => {
    for (let seed = 0; seed < 300; seed++) {
      const p = makeProblem(createRng(seed), 'tout', { kinds: ['tout'], max: 99, carry: false });
      expect((p.operands[0] % 10) + (p.operands[1] % 10)).toBeLessThan(10);
    }
  });

  it('disent ce que sont les autres quand il y a plus de deux sortes', () => {
    for (let seed = 0; seed < 200; seed++) {
      const p = makeProblem(createRng(seed), 'partie', {
        kinds: ['partie'],
        max: 100,
        carry: true,
      });
      const many = p.group!.scene.sorts.length > 2;
      expect(
        p.statement.some((s) => s.startsWith('Les autres')),
        p.statement.join(' '),
      ).toBe(many);
    }
  });
});
