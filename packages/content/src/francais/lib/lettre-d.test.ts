import { checkAnswer, generateQuestion, type FillBlankQuestion, type McqQuestion } from '@app/core';
import { describe, expect, it } from 'vitest';
import { registry } from '../../index';
import { D_FEMININE, D_FROM_FAMILY, D_WORDS, T_OR_D } from './lettre-d';
import { LETTER_D, syllableTraps } from './syllabes';

describe('la lettre d (dictée 5)', () => {
  it('un mot n’a qu’une sorte de d, et n’est que dans une colonne', () => {
    for (const w of D_WORDS.muet) {
      // Muet : un seul d, à la fin du mot.
      expect(w.split('d').length - 1, w).toBe(1);
      expect(w.endsWith('d'), w).toBe(true);
    }
    for (const w of D_WORDS.d) expect(/d$/.test(w) && !/(sud|plaid)$/.test(w), w).toBe(false);
    const all = [...D_WORDS.d, ...D_WORDS.muet];
    expect(new Set(all).size).toBe(all.length);
  });

  it('au féminin, on entend le d ; dans la famille aussi', () => {
    for (const [m, f] of D_FEMININE) {
      expect(m.endsWith('d'), m).toBe(true);
      expect(f, m).toBe(`${m}e`);
    }
    for (const [base, , word] of D_FROM_FAMILY) {
      expect(word.endsWith('d'), word).toBe(true);
      expect(base.includes(word.slice(0, -1).replace('œ', 'o')), base).toBe(true);
      expect(/d[^ ]/.test(base), base).toBe(true);
    }
  });

  it('« COMPLÈTE avec t ou d » : un seul trou, et la lettre muette est bien à la fin', () => {
    for (const w of T_OR_D) {
      expect(w.word.split('_').length - 1, w.word).toBe(1);
      expect(w.word.endsWith('_'), w.word).toBe(w.end);
      if (w.clue) expect(w.clue.includes(w.letter), w.clue).toBe(true);
    }
  });

  it('« je adore » est faux avec un indice ; j’adore, avec l’une ou l’autre apostrophe, est juste', () => {
    const plugin = registry.plugin('francais.conjugaison.conjugue-present')!;
    let vowels = 0;
    for (let seed = 1; seed < 400; seed++) {
      const q = generateQuestion(plugin, 1, seed) as FillBlankQuestion & {
        data: { answer: string };
      };
      if (!q.data.answer.startsWith('j’')) continue;
      vowels++;
      const form = q.data.answer.slice(2);
      expect(checkAnswer(plugin, q, { values: [q.data.answer] }).correct).toBe(true);
      expect(checkAnswer(plugin, q, { values: [`j'${form}`] }).correct).toBe(true);
      const wrong = checkAnswer(plugin, q, { values: [`je ${form}`] });
      expect(wrong.correct).toBe(false);
      expect(wrong.feedback).toMatch(/j’/);
    }
    expect(vowels).toBeGreaterThan(5);
  });

  it('un piège de syllabe n’est jamais la syllabe dite, ni une autre syllabe de la liste', () => {
    const all = [...LETTER_D.simple, ...LETTER_D.complex].map((s) => s.text);
    for (const s of all) {
      const traps = syllableTraps(LETTER_D, s);
      expect(traps.length, s).toBeGreaterThanOrEqual(3);
      expect(traps, s).not.toContain(s);
      for (const t of traps) expect(all, `${s} → ${t}`).not.toContain(t);
    }
  });

  it('« Écoute et touche » : la voix dit la bonne réponse', () => {
    const plugin = registry.plugin('francais.lecture.ecoute-touche')!;
    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed < 50; seed++) {
        const q = generateQuestion(plugin, level, seed) as McqQuestion & {
          data: { answer: string };
        };
        const right = q.choices.find((c) => c.id === q.data.answer)!.label;
        const syllable = [...LETTER_D.simple, ...LETTER_D.complex].find((s) => s.text === right);
        expect(q.listen).toBe(syllable?.say ?? right);
      }
    }
  });
});
