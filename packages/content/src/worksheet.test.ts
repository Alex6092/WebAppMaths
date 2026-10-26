import {
  buildWorksheet,
  expectedLevelOf,
  questionSignature,
  sheetLines,
  SHEET_ITEMS,
} from '@app/core';
import { describe, expect, it } from 'vitest';
import { registry } from './index';

const notions = registry.notions
  .filter((n) => registry.pluginsOfNotion(n.id).length > 0)
  .map((n) => n.id);
const pluginsOf = (id: string) => registry.pluginsOfNotion(id);

describe('fiches à imprimer', () => {
  it('tire des exercices pour chaque notion, sans question en double', () => {
    const sheet = buildWorksheet(
      { notions, exercises: 2, seed: 42 },
      0,
      pluginsOf,
      expectedLevelOf,
    );
    expect(sheet.exercises).toHaveLength(notions.length * 2);
    sheet.exercises.forEach((e, i) => {
      expect(e.number).toBe(i + 1);
      const plugin = registry.plugin(e.pluginId)!;
      expect(plugin.notions).toContain(e.notionId);
      expect(e.level).toBe(expectedLevelOf(plugin));
      const wanted = SHEET_ITEMS[e.items[0]!.question.widget];
      expect(e.items.length).toBeGreaterThan(0);
      expect(e.items.length).toBeLessThanOrEqual(wanted);
      const signatures = e.items.map((item) => questionSignature(plugin, item.question));
      expect(new Set(signatures).size).toBe(signatures.length);
    });
    // Deux exercices d'une même notion changent de type quand c'est possible.
    for (const id of notions) {
      const mine = sheet.exercises.filter((e) => e.notionId === id);
      if (pluginsOf(id).length > 1) expect(mine[0]!.pluginId).not.toBe(mine[1]!.pluginId);
    }
  });

  it('refait la même fiche avec la même graine, une autre pour chaque variante', () => {
    const spec = { notions: ['maths.calcul.tables'], exercises: 1, seed: 7 };
    const a = buildWorksheet(spec, 0, pluginsOf, () => 1);
    expect(buildWorksheet(spec, 0, pluginsOf, () => 1)).toEqual(a);
    const b = buildWorksheet(spec, 1, pluginsOf, () => 1);
    expect(b.exercises[0]!.items.map((i) => i.seed)).not.toEqual(
      a.exercises[0]!.items.map((i) => i.seed),
    );
  });

  it('borne le niveau demandé et donne le barème par notion', () => {
    const sheet = buildWorksheet(
      { notions: ['maths.calcul.tables', 'maths.calcul.poser-addition'], exercises: 2, seed: 3 },
      0,
      pluginsOf,
      () => 99,
    );
    for (const e of sheet.exercises)
      expect(e.level).toBe(registry.plugin(e.pluginId)!.levels.length);
    const lines = sheetLines(sheet);
    expect(lines.map((l) => l.notionId)).toEqual([
      'maths.calcul.tables',
      'maths.calcul.poser-addition',
    ]);
    expect(lines[0]!.exercises).toEqual([1, 2]);
    expect(lines[0]!.total).toBe(
      sheet.exercises.slice(0, 2).reduce((n, e) => n + e.items.length, 0),
    );
  });
});
