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

/** La marque d'une case d'événement : à côté de celles des questions (0, 1…), « e0 », « e1 »… */
export const eventMark = (slot: number) => `e${slot}`;

export const comprehensionWidget: WidgetDef<'comprehension'> = {
  id: 'comprehension',

  emptyAnswer: (q) => ({
    selected: q.items.map(() => ''),
    ...(q.events ? { order: q.events.map(() => -1) } : {}),
  }),

  validate(q, answer): answer is ComprehensionAnswer {
    if (typeof answer !== 'object' || answer === null) return false;
    const { selected, order } = answer as Partial<ComprehensionAnswer>;
    const placed = Array.isArray(order) ? order.filter((i) => i !== -1) : [];
    return (
      Array.isArray(selected) &&
      selected.length === q.items.length &&
      selected.every(
        (id, i) =>
          id === '' || (typeof id === 'string' && q.items[i]!.choices.some((c) => c.id === id)),
      ) &&
      (q.events
        ? Array.isArray(order) &&
          order.length === q.events.length &&
          order.every((i) => Number.isInteger(i) && i >= -1 && i < q.events!.length) &&
          new Set(placed).size === placed.length
        : order === undefined)
    );
  },

  isComplete: (_q, answer) =>
    answer.selected.every((id) => id !== '') && (answer.order ?? []).every((i) => i !== -1),

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
    // Chaque case d'événement compte comme une question.
    (q.events ?? []).forEach((_, slot) => {
      const event = given.order?.[slot] ?? -1;
      if (event === -1) marks[eventMark(slot)] = 'missing';
      else if (event === expected.order?.[slot]) {
        marks[eventMark(slot)] = 'ok';
        ok++;
      } else marks[eventMark(slot)] = 'wrong';
    });
    const total = q.items.length + (q.events?.length ?? 0);
    const correct = ok === total;
    const again = q.read ? 'Relis le texte' : 'Réécoute l’histoire';
    return {
      correct,
      score: total ? ok / total : 0,
      marks,
      ...(correct
        ? {}
        : {
            // Au deuxième essai, les événements mal placés retournent dans la réserve.
            feedback: q.items.length
              ? `Ce qui est en rouge n’est pas juste. ${again} si tu veux, et réessaie ! 💪`
              : `Les événements bien placés restent en vert : range les autres. ${again} si tu veux ! 💪`,
          }),
    };
  },

  // Les bonnes réponses restent, les événements bien placés aussi ; les autres sont à refaire.
  retryAnswer: (_q, given, result) => ({
    selected: given.selected.map((id, i) => (result.marks[i] === 'ok' ? id : '')),
    ...(given.order
      ? {
          order: given.order.map((event, slot) =>
            result.marks[eventMark(slot)] === 'ok' ? event : -1,
          ),
        }
      : {}),
  }),

  // L'histoire a son propre lecteur, et chaque question son bouton 🔊 : la consigne suffit ici.
  speech: () => '',
};
