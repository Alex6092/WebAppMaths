import type { GradeId } from './grades';
import type { ProgressionRules } from './progression';
import type { AnswerMap, CheckResult, PluginQuestion, WidgetId } from './question';
import type { Rng } from './rng';

export interface LevelDef<P> {
  /** Ce que l'enfant voit : « 2 chiffres avec retenue ». */
  label: string;
  /** Classe à laquelle ce niveau correspond. */
  grade: GradeId;
  /** Paramètres passés à `generate`. */
  params: P;
}

export interface GenerateContext<P> {
  rng: Rng;
  /** Niveau, à partir de 1. */
  level: number;
  params: P;
}

/**
 * Un type d'exercice. Les fonctions doivent être pures : la même graine produit
 * toujours la même question, côté navigateur comme côté serveur.
 */
export interface ExercisePlugin<W extends WidgetId = WidgetId, P = unknown, D = unknown> {
  /** Identifiant stable, stocké en base : chemin du dossier avec des points (« maths.calcul.addition-posee »). */
  id: string;
  /** À incrémenter quand le générateur change de sens (les anciennes graines ne se rejouent plus). */
  version: number;
  widget: W;
  title: string;
  description?: string;
  icon?: string;
  /** Notions entraînées (voir les fichiers domains.ts). */
  notions: string[];
  levels: LevelDef<P>[];
  /** Niveau attendu en fin d'année pour considérer la notion acquise. */
  expectedLevel?: number;
  /** Nombre d'essais par question (2 par défaut). */
  maxTries?: number;
  generate(ctx: GenerateContext<P>): PluginQuestion<W, D>;
  /** La bonne réponse : sert aux tests, au corrigé et à « voir la réponse ». */
  solve(q: PluginQuestion<W, D>): AnswerMap[W];
  /** Correction sur mesure ; sinon, celle du widget compare la réponse à `solve`. */
  check?(q: PluginQuestion<W, D>, answer: AnswerMap[W]): CheckResult;
  /** Explication affichée après une erreur. */
  explain?(q: PluginQuestion<W, D>, answer: AnswerMap[W]): string | undefined;
  /** Contraintes du niveau vérifiées par le test de contrat ; renvoie un message d'erreur. */
  invariants?(q: PluginQuestion<W, D>, ctx: GenerateContext<P>): string | undefined;
  /** Clé qui identifie deux questions identiques (par défaut : le JSON de la question). */
  signature?(q: PluginQuestion<W, D>): string;
  /** Nombre minimal de questions différentes sur 500 graines (10 par défaut). */
  minVariety?: number;
  progression?: Partial<ProgressionRules>;
  /** Pièces gagnées au premier essai (5 × niveau par défaut). */
  coins?(level: number): number;
}

export type AnyPlugin = ExercisePlugin<any, any, any>;

/** Type les paramètres des niveaux : `levels: defineLevels<Params>([...])`. */
export function defineLevels<P>(levels: LevelDef<P>[]): LevelDef<P>[] {
  return levels;
}

/**
 * Déclare un type d'exercice :
 *
 *   export default definePlugin('number-input', { id: …, levels: […], generate, solve });
 */
export function definePlugin<W extends WidgetId, P, D>(
  widget: W,
  plugin: Omit<ExercisePlugin<W, P, D>, 'widget'>,
): ExercisePlugin<W, P, D> {
  return { ...plugin, widget };
}
