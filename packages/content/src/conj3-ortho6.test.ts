import { checkAnswer, createRng, type ExercisePlugin, type WidgetId } from '@app/core';
import { describe, expect, it } from 'vitest';
import colorie from './francais/conjugaison/colorie-premier-groupe/plugin';
import terminaison from './francais/conjugaison/complete-terminaison/plugin';
import gerCer from './francais/conjugaison/nous-ger-cer/plugin';
import radical from './francais/conjugaison/radical-terminaison/plugin';
import { conjugate } from './francais/lib/conjugaison';
import { P_HEARD, P_LESSON_GROUPS, P_SILENT } from './francais/lib/lettre-p';
import { ENDING_CHOICES, OTHER_VERBS, REGULAR_ER } from './francais/lib/premier-groupe';
import complete from './francais/orthographe/complete-lettre-p/plugin';
import classe from './francais/orthographe/lettre-p-classe/plugin';

const SEEDS = Array.from({ length: 80 }, (_, i) => i);

function questionAt<W extends WidgetId, P, D>(
  plugin: ExercisePlugin<W, P, D>,
  level: number,
  seed: number,
) {
  return plugin.generate({ level, rng: createRng(seed), params: plugin.levels[level - 1]!.params });
}

describe('CONJ 3 : le présent des verbes du 1er groupe', () => {
  it('les terminaisons de la leçon', () => {
    expect(ENDING_CHOICES).toEqual(['e', 'es', 'ons', 'ez', 'ent']);
  });

  it('le radical des verbes réguliers est l’infinitif sans -er, à toutes les personnes', () => {
    for (const inf of REGULAR_ER) {
      expect(inf.endsWith('er')).toBe(true);
      for (const p of [0, 1, 2, 3, 4, 5] as const)
        expect(conjugate(inf, 'present', p).startsWith(inf.slice(0, -2))).toBe(true);
    }
    expect(REGULAR_ER).toEqual(expect.arrayContaining(['jouer', 'sauter', 'conjuguer']));
    expect(REGULAR_ER).not.toContain('manger');
    expect(OTHER_VERBS).not.toContain('aller');
  });

  it('jouer → jou, nous jouons → jou + ons', () => {
    const q1 = SEEDS.map((s) => questionAt(radical, 1, s)).find((q) => q.data.inf === 'jouer')!;
    expect(q1.prompt).toBe('jouer → {0} / er');
    expect(checkAnswer(radical, q1, { values: ['jou'] }).correct).toBe(true);
    expect(checkAnswer(radical, q1, { values: ['joue'] }).correct).toBe(false);
    const q2 = questionAt(radical, 2, 3);
    expect(radical.solve(q2).values[0]! + radical.solve(q2).values[1]!).toBe(
      conjugate(q2.data.inf, 'present', q2.data.person),
    );
  });

  it('le verbe entier : six terminaisons, avec j’ devant une voyelle', () => {
    for (const seed of SEEDS) {
      const q = questionAt(terminaison, 3, seed);
      expect(terminaison.solve(q).values).toEqual(['e', 'es', 'e', 'ons', 'ez', 'ent']);
      const first = q.prompt.split('\n')[0]!;
      expect(first.startsWith(/^[aeiouéh]/.test(q.data.inf) ? 'j’' : 'je ')).toBe(true);
    }
  });

  it('dans une phrase, la terminaison complète bien le verbe conjugué', () => {
    for (const seed of SEEDS) {
      const q = questionAt(terminaison, 2, seed);
      const filled = q.prompt.replace('{0}', terminaison.solve(q).values[0]!);
      expect(filled.startsWith(q.data.sentence!.slice(0, -1))).toBe(true);
    }
  });

  it('-ger et -cer : nous mangeons, nous commençons, mais il lance', () => {
    const forms = new Set<string>();
    for (const level of [1, 2]) {
      for (const seed of SEEDS) {
        const q = questionAt(gerCer, level, seed);
        forms.add(gerCer.solve(q).selected[0]!);
        expect(q.choices.map((c) => c.id)).toContain(q.data.wrong);
      }
    }
    expect(forms).toContain('mangeons');
    expect(forms).toContain('commençons');
    expect([...forms].some((f) => /c(e|es|ent)$/.test(f))).toBe(true);
  });

  it('colorie un mélange de verbes du 1er groupe et d’autres', () => {
    for (const seed of SEEDS) {
      const q = questionAt(colorie, 2, seed);
      const right = q.data.infinitives.filter((_, i) => q.data.right[i]);
      expect(right.every((inf) => inf.endsWith('er'))).toBe(true);
      expect(
        q.data.infinitives.filter((_, i) => !q.data.right[i]).some((i) => i.endsWith('er')),
      ).toBe(false);
    }
  });
});

describe('ORTHO 6 : la lettre p', () => {
  it('reprend les mots de la fiche dans les cinq cases', () => {
    expect(P_LESSON_GROUPS.map((g) => g.words.slice(0, 2))).toEqual([
      ['une poule', 'pouvoir'],
      ['s’appeler', 'une enveloppe'],
      ['une photo', 'un phare'],
      ['compter', 'sept'],
      ['un loup', 'beaucoup'],
    ]);
  });

  it('le p s’entend ou non : aucun mot dans les deux listes, aucun ph', () => {
    expect(P_HEARD.filter((w) => P_SILENT.includes(w))).toEqual([]);
    expect([...P_HEARD, ...P_SILENT].some((w) => w.includes('ph'))).toBe(false);
  });

  it('range dans les cinq cases au niveau 2, deux mots par case', () => {
    const q = questionAt(classe, 2, 1);
    expect(q.categories).toHaveLength(5);
    expect(q.items).toHaveLength(10);
  });

  it('complète avec p, pp ou ph, sans oublier le p muet', () => {
    const answers = new Set(SEEDS.map((s) => complete.solve(questionAt(complete, 3, s)).values[0]));
    expect(answers).toEqual(new Set(['p', 'pp', 'ph']));
  });
});
