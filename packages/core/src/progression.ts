/**
 * Niveau par type d'exercice, sur une fenêtre glissante des dernières réponses
 * (au premier essai) faites au niveau courant.
 */
export interface ProgressionRules {
  /** Taille de la fenêtre glissante. */
  window: number;
  /** Taux de réussite (fenêtre pleine) pour monter. */
  upRate: number;
  /** Taux de réussite (fenêtre pleine) en dessous duquel on descend. */
  downRate: number;
  /** Erreurs consécutives qui font descendre. */
  downConsecutiveErrors: number;
}

export const DEFAULT_PROGRESSION: ProgressionRules = {
  window: 5,
  upRate: 0.8,
  downRate: 0.4,
  downConsecutiveErrors: 3,
};

export interface LevelState {
  level: number;
  /** Résultats au premier essai depuis l'arrivée à ce niveau (le plus récent à la fin). */
  recent: boolean[];
  consecutiveErrors: number;
}

export type LevelChange = 'up' | 'down' | null;

export function newLevelState(level: number): LevelState {
  return { level, recent: [], consecutiveErrors: 0 };
}

export function successRate(results: readonly boolean[]): number {
  return results.length ? results.filter(Boolean).length / results.length : 0;
}

export function applyResult(
  state: LevelState,
  success: boolean,
  levelCount: number,
  overrides: Partial<ProgressionRules> = {},
): { state: LevelState; change: LevelChange } {
  const rules = { ...DEFAULT_PROGRESSION, ...overrides };
  const recent = [...state.recent, success].slice(-rules.window);
  const consecutiveErrors = success ? 0 : state.consecutiveErrors + 1;
  const full = recent.length >= rules.window;
  const rate = successRate(recent);

  if (full && rate >= rules.upRate && state.level < levelCount) {
    return { state: newLevelState(state.level + 1), change: 'up' };
  }
  const struggling =
    consecutiveErrors >= rules.downConsecutiveErrors || (full && rate <= rules.downRate);
  if (struggling && state.level > 1) {
    return { state: newLevelState(state.level - 1), change: 'down' };
  }
  return { state: { level: state.level, recent, consecutiveErrors }, change: null };
}
