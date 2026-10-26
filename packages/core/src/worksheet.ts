/**
 * Fiches à imprimer : pour chaque notion choisie, un ou plusieurs exercices (un exercice = une
 * consigne et quelques questions du même type). Tout se tire d'une graine : la même fiche se
 * réimprime à l'identique, et chaque variante a ses propres questions.
 */
import { generateQuestion, questionSignature } from './engine';
import type { AnyPlugin } from './plugin';
import type { PluginQuestion, WidgetId } from './question';
import { createRng } from './rng';

/** Questions par exercice, selon la place qu'elles prennent sur la page. */
export const SHEET_ITEMS: Record<WidgetId, number> = {
  'column-op': 4,
  'number-input': 6,
  mcq: 4,
  'word-select': 3,
  classify: 1,
  'fill-blank': 4,
  geometry: 1,
  order: 3,
};

export type SheetLevel = 'current' | 'expected';
/** practice : fiche d'entraînement ; evaluation : au gabarit des évaluations de l'école. */
export type SheetFormat = 'practice' | 'evaluation';

export interface WorksheetSpec {
  title: string;
  notions: string[];
  /** Exercices par notion. */
  exercises: number;
  level: SheetLevel;
  format: SheetFormat;
  /** Nombre de fiches différentes sur les mêmes notions. */
  variants: number;
  answerKey: boolean;
  seed: number;
}

export interface SheetItem {
  seed: number;
  question: PluginQuestion;
}

export interface SheetExercise {
  /** Numéro de l'exercice sur la fiche (1, 2…). */
  number: number;
  notionId: string;
  pluginId: string;
  level: number;
  /** Consigne commune à toutes les questions, sinon null (chaque question a la sienne). */
  instruction: string | null;
  items: SheetItem[];
}

export interface Worksheet {
  /** 0 pour la première fiche, 1 pour la deuxième… */
  variant: number;
  exercises: SheetExercise[];
}

/** Barème d'une notion : une question = un point. */
export function sheetLines(
  sheet: Worksheet,
): { notionId: string; exercises: number[]; total: number }[] {
  const lines = new Map<string, { notionId: string; exercises: number[]; total: number }>();
  for (const e of sheet.exercises) {
    const line = lines.get(e.notionId) ?? { notionId: e.notionId, exercises: [], total: 0 };
    line.exercises.push(e.number);
    line.total += e.items.length;
    lines.set(e.notionId, line);
  }
  return [...lines.values()];
}

/** « A », « B », « C »… : le nom d'une variante. */
export const variantName = (variant: number) => String.fromCharCode(65 + variant);

/**
 * Tire une fiche. pluginsOf donne les exercices d'une notion, levelOf le niveau voulu pour un
 * exercice. Les exercices d'une notion changent de type tant qu'il y en a d'autres.
 */
export function buildWorksheet(
  spec: Pick<WorksheetSpec, 'notions' | 'exercises' | 'seed'>,
  variant: number,
  pluginsOf: (notionId: string) => readonly AnyPlugin[],
  levelOf: (plugin: AnyPlugin) => number,
): Worksheet {
  const rng = createRng((spec.seed + variant * 0x9e3779b1) >>> 0);
  const exercises: SheetExercise[] = [];
  for (const notionId of spec.notions) {
    const plugins = rng.shuffle(pluginsOf(notionId));
    if (plugins.length === 0) continue;
    for (let n = 0; n < spec.exercises; n++) {
      const plugin = plugins[n % plugins.length]!;
      const level = Math.min(Math.max(1, levelOf(plugin)), plugin.levels.length);
      const items: SheetItem[] = [];
      const seen = new Set<string>();
      // Le nombre de questions dépend du widget de la première.
      let wanted = 1;
      for (let tries = 0; items.length < wanted && tries < 60; tries++) {
        const seed = rng.int(0, 0xffffffff);
        const question = generateQuestion(plugin, level, seed);
        const signature = questionSignature(plugin, question);
        if (seen.has(signature)) continue;
        seen.add(signature);
        items.push({ seed, question });
        if (items.length === 1) wanted = SHEET_ITEMS[question.widget];
      }
      const instructions = new Set(items.map((i) => i.question.instruction));
      exercises.push({
        number: exercises.length + 1,
        notionId,
        pluginId: plugin.id,
        level,
        instruction: instructions.size === 1 ? items[0]!.question.instruction : null,
        items,
      });
    }
  }
  return { variant, exercises };
}
