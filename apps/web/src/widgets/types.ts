import type { AnswerMap, Mark, QuestionOf, WidgetId } from '@app/core';

/**
 * answering : l'enfant répond ; retry : deuxième essai (les erreurs sont marquées) ;
 * success : réussi ; revealed : la bonne réponse est montrée ;
 * review : une réponse déjà donnée, figée, ce qui est faux en rouge (pour le parent).
 */
export type Phase = 'answering' | 'retry' | 'success' | 'revealed' | 'review';

export interface WidgetProps<W extends WidgetId> {
  question: QuestionOf<W>;
  answer: AnswerMap[W];
  phase: Phase;
  marks: Record<string, Mark> | null;
  /** Bonne réponse : pour l'afficher (revealed) ou donner un indice (retry). */
  solution: AnswerMap[W] | null;
}

export function isLocked(phase: Phase): boolean {
  return phase === 'success' || phase === 'revealed' || phase === 'review';
}
