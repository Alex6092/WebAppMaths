import { createRng, type ExercisePlugin, type WidgetId } from '@app/core';
import { describe, expect, it } from 'vitest';
import choisis from './francais/grammaire/choisis-determinant/plugin';
import colorieNoms from './francais/grammaire/colorie-noms/plugin';
import genreNombre from './francais/grammaire/genre-nombre/plugin';
import majuscule from './francais/grammaire/majuscule-nom-propre/plugin';
import { ARTICLES, NOUN_SENTENCES } from './francais/lib/nom-determinant';

const SEEDS = Array.from({ length: 80 }, (_, i) => i);

function questionAt<W extends WidgetId, P, D>(
  plugin: ExercisePlugin<W, P, D>,
  level: number,
  seed: number,
) {
  return plugin.generate({ level, rng: createRng(seed), params: plugin.levels[level - 1]!.params });
}

describe('leçons « Le nom » et « Le déterminant »', () => {
  it('chaque nom commun suit son déterminant, et les déterminants sont des articles', () => {
    for (const { text, words } of NOUN_SENTENCES) {
      words.forEach((w, i) => {
        if (w.role === 'common') expect(words[i - 1]?.role, text).toBe('det');
        if (w.role === 'det') {
          expect(ARTICLES as readonly string[]).toContain(w.text.toLowerCase());
          expect(words[i + 1]?.role, text).toBe('common');
        }
        if (w.role === 'proper') expect(w.text[0], text).toMatch(/[A-ZÉ]/);
      });
    }
  });

  it('reconstitue la phrase avec l’élision : l’arbre, l’étagère', () => {
    const s = NOUN_SENTENCES.find((x) => x.text.includes('l’arbre'))!;
    expect(s.text).toBe('Un oiseau chante dans l’arbre.');
    expect(s.words.at(-1)).toEqual({ text: 'arbre', role: 'common', glue: true });
  });

  it('colorie les noms propres et communs en deux couleurs', () => {
    const q = SEEDS.map((s) => questionAt(colorieNoms, 2, s)).find((x) =>
      x.data.sentence.startsWith('Le chat de Léa'),
    )!;
    expect(colorieNoms.solve(q).picks).toEqual([
      null,
      'common',
      null,
      'proper',
      null,
      null,
      null,
      'common',
      null,
    ]);
  });

  it('les noms propres ont perdu leur majuscule, et eux seuls', () => {
    for (const seed of SEEDS) {
      const q = questionAt(majuscule, 1, seed);
      q.tokens.forEach((t, i) => {
        if (q.data.right[i]) expect(t.text).toBe(t.text.toLowerCase());
      });
      expect(q.data.right.some(Boolean)).toBe(true);
    }
  });

  it('l’ devant une voyelle, les au pluriel, et autant de féminins que de masculins', () => {
    const answers = SEEDS.map((s) => questionAt(choisis, 3, s)).map((q) => ({
      noun: q.data.noun,
      answer: choisis.solve(q).values[0],
    }));
    for (const { noun, answer } of answers) {
      if (answer === 'l’') expect(noun).toMatch(/^[aeiouéèêh]/);
      else expect(noun).not.toMatch(/^[aeiouéèêh]/);
    }
    expect(new Set(answers.map((a) => a.answer))).toEqual(new Set(['le', 'la', 'l’', 'les']));
    const genders = SEEDS.map((s) => choisis.solve(questionAt(choisis, 2, s)).values[0]);
    const une = genders.filter((g) => g === 'une').length;
    expect(une).toBeGreaterThan(25);
    expect(une).toBeLessThan(55);
  });

  it('masculin ou féminin : jamais « l’ », un de chaque au moins', () => {
    for (const seed of SEEDS) {
      const q = questionAt(genreNombre, 1, seed);
      expect(q.items.some((i) => i.text.startsWith('l’'))).toBe(false);
      for (const id of ['m', 'f'])
        expect(q.data.placed.filter((p) => p === id).length).toBeGreaterThanOrEqual(1);
    }
  });
});
