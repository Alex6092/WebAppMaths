import { gradeIndex, type GradeId } from './grades';
import type { AnyPlugin, LevelDef } from './plugin';
import type { CheckResult, PluginQuestion } from './question';
import { createRng } from './rng';
import { mathToSpeech } from './speech';
import { getWidget } from './widgets';

export const DEFAULT_MAX_TRIES = 2;

export function levelDef(plugin: AnyPlugin, level: number): LevelDef<unknown> {
  const def = plugin.levels[level - 1];
  if (!def) throw new Error(`${plugin.id} : niveau ${level} inexistant`);
  return def;
}

export function generateQuestion(plugin: AnyPlugin, level: number, seed: number): PluginQuestion {
  return plugin.generate({ rng: createRng(seed), level, params: levelDef(plugin, level).params });
}

/** Vérifie la forme d'une réponse reçue (données non fiables venant du réseau). */
export function isValidAnswer(q: PluginQuestion, answer: unknown): boolean {
  return getWidget(q.widget).validate(q as never, answer);
}

export function checkAnswer(plugin: AnyPlugin, q: PluginQuestion, answer: unknown): CheckResult {
  if (plugin.check) return plugin.check(q, answer as never);
  return getWidget(q.widget).compare(q as never, plugin.solve(q) as never, answer as never);
}

export function maxTries(plugin: AnyPlugin): number {
  return plugin.maxTries ?? DEFAULT_MAX_TRIES;
}

export interface GradedAttempt {
  question: PluginQuestion;
  results: CheckResult[];
  firstTryCorrect: boolean;
  solved: boolean;
  tries: number;
  /** Score du premier essai. */
  score: number;
}

/** Recorrige une tentative à partir de la graine : le serveur ne fait pas confiance au client. */
export function gradeAttempt(
  plugin: AnyPlugin,
  level: number,
  seed: number,
  answers: readonly unknown[],
): GradedAttempt {
  const question = generateQuestion(plugin, level, seed);
  const used = answers.slice(0, maxTries(plugin));
  if (used.length === 0) throw new Error('Aucune réponse');
  for (const answer of used) {
    if (!isValidAnswer(question, answer)) throw new Error('Réponse mal formée');
  }
  const results = used.map((answer) => checkAnswer(plugin, question, answer));
  return {
    question,
    results,
    firstTryCorrect: results[0]!.correct,
    solved: results.some((r) => r.correct),
    tries: used.length,
    score: results[0]!.score,
  };
}

/** Pièces : tout au premier essai, la moitié au deuxième, rien sinon. */
export function coinsFor(
  plugin: AnyPlugin,
  level: number,
  firstTryCorrect: boolean,
  solved: boolean,
): number {
  const base = plugin.coins ? plugin.coins(level) : 5 * level;
  if (firstTryCorrect) return base;
  return solved ? Math.ceil(base / 2) : 0;
}

/** Niveau de départ : le premier niveau de la classe de l'enfant. */
export function initialLevel(plugin: AnyPlugin, grade: GradeId): number {
  const target = gradeIndex(grade);
  const index = plugin.levels.findIndex((l) => gradeIndex(l.grade) >= target);
  return index === -1 ? plugin.levels.length : index + 1;
}

export function questionSignature(plugin: AnyPlugin, q: PluginQuestion): string {
  return plugin.signature ? plugin.signature(q) : JSON.stringify(q);
}

/** Texte à lire à voix haute : consigne puis énoncé. */
export function questionSpeech(q: PluginQuestion): string {
  if (q.speech) return q.speech;
  const body = getWidget(q.widget).speech(q as never);
  return [mathToSpeech(q.instruction), q.listen, q.text, body].filter(Boolean).join('. ');
}
