import { createRng, type ExercisePlugin, type WidgetId } from '@app/core';
import { describe, expect, it } from 'vitest';
import { E_WORDS } from './francais/lib/lettre-e';
import complete from './francais/orthographe/complete-lettre-e/plugin';
import colorie from './francais/orthographe/lettre-e-colorie/plugin';

const SEEDS = Array.from({ length: 200 }, (_, i) => i);

function questionAt<W extends WidgetId, P, D>(
  plugin: ExercisePlugin<W, P, D>,
  level: number,
  seed: number,
) {
  return plugin.generate({ level, rng: createRng(seed), params: plugin.levels[level - 1]!.params });
}

describe('ORTHO 8 : la lettre e', () => {
  it('chaque mot n’est rangé qu’à un seul son, et contient bien un e', () => {
    const all = Object.values(E_WORDS).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const w of all) expect(w).toMatch(/[eéèêëœ]/);
  });

  it('les mots de la fiche sont dans le code couleur', () => {
    for (const w of ['un renard', 'un marché', 'chez', 'chanter', 'un robinet', 'Noël'])
      expect(Object.values(E_WORDS).flat()).toContain(w);
    for (const w of ['la laitue', 'beau', 'lent', 'un œuf', 'plein'])
      expect(Object.values(E_WORDS).flat()).toContain(w);
  });

  it('quatre couleurs par niveau, deux mots par couleur', () => {
    for (const level of [1, 2]) {
      const q = questionAt(colorie, level, 5);
      expect(q.colors).toHaveLength(4);
      for (const c of q.colors) expect(q.data.sounds.filter((s) => s === c.id)).toHaveLength(2);
    }
  });

  it('chaque niveau de « complète » fait choisir toutes ses écritures', () => {
    const expected = [
      ['é', 'è', 'ê'],
      ['é', 'er', 'ez'],
      ['ei', 'et', 'è', 'ê'],
      ['en', 'em'],
    ];
    expected.forEach((letters, i) => {
      const answers = new Set(
        SEEDS.map((s) => complete.solve(questionAt(complete, i + 1, s)).values[0]),
      );
      expect(answers).toEqual(new Set(letters));
    });
  });

  it('em seulement devant m, b ou p', () => {
    for (const seed of SEEDS) {
      const q = questionAt(complete, 4, seed);
      const next = q.prompt.split('{0}')[1]![0];
      expect(complete.solve(q).values[0] === 'em').toBe(['m', 'b', 'p'].includes(next!));
    }
  });
});
