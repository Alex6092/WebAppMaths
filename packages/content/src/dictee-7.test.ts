import { checkAnswer, createRng, type ExercisePlugin, type WidgetId } from '@app/core';
import { describe, expect, it } from 'vitest';
import vaVont from './francais/conjugaison/va-vont/plugin';
import { DICTEE_7, written } from './francais/lib/dictee-classe';
import { A_WORDS } from './francais/lib/lettre-a';
import complete from './francais/orthographe/complete-lettre-a/plugin';
import dictee from './francais/orthographe/dictee-7/plugin';
import colorie from './francais/orthographe/lettre-a-colorie/plugin';

const SEEDS = Array.from({ length: 200 }, (_, i) => i);

function questionAt<W extends WidgetId, P, D>(
  plugin: ExercisePlugin<W, P, D>,
  level: number,
  seed: number,
) {
  return plugin.generate({ level, rng: createRng(seed), params: plugin.levels[level - 1]!.params });
}

describe('dictée 7 : la lettre A', () => {
  it('reprend les deux listes de la fiche', () => {
    expect(DICTEE_7.lists.map(({ words }) => words.map(written))).toEqual([
      ['un continent', 'la maitresse', 'grand', 'nouveau', 'beaucoup', 'aimer'],
      ['une étape', 'prochain', 'maintenant', 'autour', 'annoncer', 'travailler'],
    ]);
  });

  it('accepte maitresse et maîtresse, même en début de phrase', () => {
    const word = SEEDS.map((s) => questionAt(dictee, 1, s)).find(
      (q) => q.data.text === 'la maitresse',
    )!;
    expect(checkAnswer(dictee, word, { values: ['la', 'maitresse'] }).correct).toBe(true);
    expect(checkAnswer(dictee, word, { values: ['la', 'maîtresse'] }).correct).toBe(true);
    expect(checkAnswer(dictee, word, { values: ['la', 'maitrese'] }).correct).toBe(false);

    const sentence = SEEDS.map((s) => questionAt(dictee, 4, s)).find((q) =>
      q.data.text.startsWith('La maitresse'),
    )!;
    const values = [...sentence.data.values];
    values[1] = 'maîtresse';
    expect(checkAnswer(dictee, sentence, { values }).correct).toBe(true);
  });

  it('le code couleur : six sons, deux mots chacun, sans mot en double', () => {
    const all = Object.values(A_WORDS).flat();
    expect(new Set(all).size).toBe(all.length);
    const q = questionAt(colorie, 2, 3);
    expect(q.colors).toHaveLength(6);
    for (const c of q.colors) expect(q.data.sounds.filter((s) => s === c.id)).toHaveLength(2);
  });

  it('complète avec a, ai ou an : les mots de la fiche', () => {
    const prompts = new Set(SEEDS.map((s) => questionAt(complete, 1, s).prompt));
    for (const p of ['l’enf{0}nt', 'jam{0}s', 'mainten{0}t', 'tr{0}vailler', 'mam{0}n'])
      expect(prompts).toContain(p);
  });

  it('va pour un seul, vont pour plusieurs ; la classe va', () => {
    for (const seed of SEEDS) {
      const q = questionAt(vaVont, 1, seed);
      const answer = vaVont.solve(q).values[0];
      if (q.data.subject === 'La classe' || q.data.subject === 'Lila') expect(answer).toBe('va');
      if (q.data.subject.includes(' et ') || q.data.subject.startsWith('Les'))
        expect(answer).toBe('vont');
    }
    const forms = new Set(SEEDS.map((s) => vaVont.solve(questionAt(vaVont, 2, s)).values[0]));
    expect(forms).toEqual(new Set(['vais', 'vas', 'va', 'allons', 'allez', 'vont']));
  });
});
