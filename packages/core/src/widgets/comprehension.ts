import type {
  ComprehensionAnswer,
  ComprehensionItem,
  ComprehensionQuestion,
  Mark,
} from '../question';
import type { WidgetDef } from './types';

/** Les phrases de l'histoire, à la suite : le rang d'une phrase est celui de `proof`. */
export function storySentences(q: Pick<ComprehensionQuestion, 'story'>): string[] {
  return q.story.flat();
}

/** Une question dite à voix haute, avec ses choix : « Qui aide Lila ? Un écureuil, un oiseau ou un chat ? » */
export function itemSpeech(item: ComprehensionItem): string {
  const labels = item.choices.map((c) => c.label);
  const last = labels.pop();
  const choices = labels.length ? `${labels.join(', ')} ou ${last}` : (last ?? '');
  return `${item.ask} ${choices} ?`;
}

export const comprehensionWidget: WidgetDef<'comprehension'> = {
  id: 'comprehension',

  emptyAnswer: (q) => ({ selected: q.items.map(() => '') }),

  validate(q, answer): answer is ComprehensionAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { selected } = answer as Partial<ComprehensionAnswer>;
    return (
      Array.isArray(selected) &&
      selected.length === q.items.length &&
      selected.every(
        (id, i) =>
          id === '' || (typeof id === 'string' && q.items[i]!.choices.some((c) => c.id === id)),
      )
    );
  },

  isComplete: (_q, answer) => answer.selected.every((id) => id !== ''),

  compare(q, expected, given) {
    const marks: Record<string, Mark> = {};
    let ok = 0;
    q.items.forEach((_, i) => {
      const id = given.selected[i] ?? '';
      if (id === '') marks[i] = 'missing';
      else if (id === expected.selected[i]) {
        marks[i] = 'ok';
        ok++;
      } else marks[i] = 'wrong';
    });
    const correct = ok === q.items.length;
    return {
      correct,
      score: q.items.length ? ok / q.items.length : 0,
      marks,
      ...(correct
        ? {}
        : {
            feedback: `Ce qui est en rouge n’est pas juste. ${q.read ? 'Relis le texte' : 'Réécoute l’histoire'} si tu veux, et réessaie ! 💪`,
          }),
    };
  },

  // Les bonnes réponses restent ; les autres sont à refaire.
  retryAnswer: (_q, given, result) => ({
    selected: given.selected.map((id, i) => (result.marks[i] === 'ok' ? id : '')),
  }),

  // L'histoire a son propre lecteur, et chaque question son bouton 🔊 : la consigne suffit ici.
  speech: () => '',
};
