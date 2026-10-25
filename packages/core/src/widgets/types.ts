import type { AnswerMap, CheckResult, QuestionOf, WidgetId } from '../question';

/**
 * Logique d'un widget, indépendante de l'affichage : réponse vide, réponse complète,
 * correction par défaut. Le rendu (Svelte) vit dans apps/web/src/widgets.
 */
export interface WidgetDef<W extends WidgetId> {
  id: W;
  emptyAnswer(q: QuestionOf<W>): AnswerMap[W];
  /** Vérifie la forme d'une réponse venue du réseau. */
  validate(q: QuestionOf<W>, answer: unknown): answer is AnswerMap[W];
  /** Toutes les cases sont-elles remplies ? (sinon on n'envoie pas la réponse) */
  isComplete(q: QuestionOf<W>, answer: AnswerMap[W]): boolean;
  /** Correction par défaut : compare la réponse donnée à celle de `solve`. */
  compare(q: QuestionOf<W>, expected: AnswerMap[W], given: AnswerMap[W]): CheckResult;
  /** Réponse conservée pour un nouvel essai : on efface seulement ce qui est faux. */
  retryAnswer(q: QuestionOf<W>, given: AnswerMap[W], result: CheckResult): AnswerMap[W];
  /** Lecture à voix haute de l'énoncé (la consigne est lue avant). */
  speech(q: QuestionOf<W>): string;
}
