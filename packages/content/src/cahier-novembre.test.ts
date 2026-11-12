import {
  buildWorksheet,
  checkAnswer,
  createRng,
  questionSpeech,
  type ExercisePlugin,
  type WidgetId,
} from '@app/core';
import { describe, expect, it } from 'vitest';
import present from './francais/conjugaison/present-ils-elles/plugin';
import { DICTEE_6, written } from './francais/lib/dictee-classe';
import pluriel from './francais/orthographe/pluriel-groupe/plugin';
import { registry } from './index';
import longueurs from './maths/mesures/compare-longueurs/plugin';
import { NUTRIENT_TABLE_NOTION } from './qlm/lib/nutriments';
import tableau from './qlm/vivant/lis-tableau-nutriments/plugin';

const SEEDS = Array.from({ length: 80 }, (_, i) => i);

function questionAt<W extends WidgetId, P, D>(
  plugin: ExercisePlugin<W, P, D>,
  level: number,
  seed: number,
) {
  return plugin.generate({ level, rng: createRng(seed), params: plugin.levels[level - 1]!.params });
}

describe('cahier CE1 du 12 novembre', () => {
  it('reprend les deux listes de la dictée avec leurs déterminants', () => {
    expect(DICTEE_6.lists.map(({ words }) => words.map(written))).toEqual([
      ['le loup', 'un groupe', 'une photo', 'petit', 'apporter', 'montrer'],
      ['une espèce', 'une proie', 'l’hémisphère', 'présent', 'nord', 'chasser'],
    ]);
  });

  it('accorde le groupe nominal et conserve le complément', () => {
    const q = SEEDS.map((seed) => questionAt(pluriel, 1, seed)).find((question) =>
      question.prompt.startsWith('une belle photo'),
    )!;
    for (const answer of ['de belles photos de loups', 'des belles photos de loups']) {
      expect(checkAnswer(pluriel, q, { values: [answer] }).correct).toBe(true);
    }
    for (const answer of [
      'de belles photos',
      'de belles photos de loup',
      'de belle photos de loups',
    ]) {
      expect(checkAnswer(pluriel, q, { values: [answer] }).correct).toBe(false);
    }
  });

  it('entraîne les quatre verbes avec les deux pronoms et la terminaison -ent', () => {
    const questions = SEEDS.map((seed) => questionAt(present, 1, seed));
    expect(new Set(questions.map((q) => q.prompt)).size).toBe(8);
    expect(new Set(questions.map((q) => present.solve(q).values[0]))).toEqual(
      new Set(['montrent', 'apportent', 'chassent', 'trouvent']),
    );
  });

  it('compare dans la même unité et génère aussi des égalités', () => {
    const questions = SEEDS.map((seed) => questionAt(longueurs, 2, seed));
    expect(new Set(questions.map((q) => longueurs.solve(q).selected[0]))).toEqual(
      new Set(['lt', 'eq', 'gt']),
    );
    const equal = questions.find((q) => longueurs.solve(q).selected[0] === 'eq')!;
    const [left, right] = equal.prompt!.split(' {?} ');
    expect(left).not.toBe(right);
    expect(longueurs.explain?.(equal, longueurs.solve(equal))).toContain('cm +');
  });

  it('pose des questions sur les six colonnes, avec un seul maximum et une lecture avec unités', () => {
    const columns = new Set<string>();
    for (const level of [1, 2]) {
      for (const seed of SEEDS) {
        const q = questionAt(tableau, level, seed);
        const { caption, columns: headings, rows } = q.table!;
        const target = headings.findIndex(({ label }) => q.prompt!.includes(`en ${label} ?`));
        columns.add(headings[target]!.label);
        expect(rows.every(({ values }) => values.length === headings.length)).toBe(true);
        const values = rows.map((row) => Number(row.values[target]));
        expect(values.filter((value) => value === Math.max(...values))).toHaveLength(1);
        const speech = questionSpeech(q);
        expect(speech).toContain(caption);
        for (const row of rows) expect(speech).toContain(row.label);
        expect(speech).toMatch(/protéines \d+ grammes/);
        expect(speech).toMatch(/calcium \d+ milligrammes/);
      }
    }
    expect(columns.size).toBe(6);
    const sheet = buildWorksheet(
      { notions: [NUTRIENT_TABLE_NOTION], exercises: 1, seed: 12 },
      0,
      (notion) => registry.pluginsOfNotion(notion),
      () => 1,
    );
    expect(sheet.exercises[0]?.items).toHaveLength(2);
  });
});
