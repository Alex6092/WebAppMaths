/**
 * Évaluation blanche : le parent choisit des notions (les lignes de compétence de l'école) et
 * un nombre de questions par notion. L'enfant répond une seule fois à chaque question, sans
 * correction ni pièces ; le bilan donne, par ligne, le barème ( x / n ) et le code de l'école.
 */

/** Questions par notion proposées au parent. */
export const EVALUATION_SIZES = [3, 4, 5, 6] as const;
export const DEFAULT_EVALUATION_SIZE = 4;

/** Codes de l'école : acquis, en cours d'acquisition, non acquis. */
export type EvaluationCode = 'A' | 'ECA' | 'NA';
export const EVALUATION_CODES: readonly EvaluationCode[] = ['A', 'ECA', 'NA'];

/** Code d'une ligne de compétence : A dès 75 % de réussite, ECA dès 50 %, sinon NA. */
export function evaluationCode(points: number, total: number): EvaluationCode {
  if (total <= 0) return 'NA';
  const rate = points / total;
  return rate >= 0.75 ? 'A' : rate >= 0.5 ? 'ECA' : 'NA';
}
