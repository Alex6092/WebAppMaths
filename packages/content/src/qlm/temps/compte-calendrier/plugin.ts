import { daysInMonth, defineLevels, definePlugin, MONTHS, WEEKDAYS } from '@app/core';
import { daysOn, ORDINALS, plural, randomPage } from '../../lib/calendrier';

// Chercher sur le calendrier : combien de mercredis, la date du premier lundi,
// puis « dans combien de jours ? » entre deux jours entourés.

interface Params {
  /** count : compter ou trouver une date ; wait : dans combien de jours. */
  ask: 'count' | 'wait';
}

interface Data {
  answer: number;
  /** Comment on trouve la réponse, pour l'explication. */
  how: string;
}

const EVENTS = ['la fête de l’école', 'l’anniversaire de Lila', 'la sortie au zoo', 'le spectacle'];

export default definePlugin<'number-input', Params, Data>('number-input', {
  id: 'qlm.temps.compte-calendrier',
  version: 1,
  title: 'Chercher sur le calendrier',
  description: 'Combien de mercredis ? Dans combien de jours ?',
  icon: '🔎',
  notions: ['qlm.temps.calendrier'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Compter, trouver une date', grade: 'CE1', params: { ask: 'count' } },
    { label: 'Dans combien de jours ?', grade: 'CE1', params: { ask: 'wait' } },
  ]),

  generate({ rng, params }) {
    const page = randomPage(rng);
    const month = MONTHS[page.month - 1]!;
    const picture = { kind: 'calendar' as const, ...page };
    const base = {
      widget: 'number-input' as const,
      instruction: 'REGARDE le calendrier et RÉPONDS.',
      maxLength: 2,
    };
    if (params.ask === 'wait') {
      const today = rng.int(1, 20);
      const event = rng.int(today + 2, Math.min(today + 20, daysInMonth(page.year, page.month)));
      return {
        ...base,
        text: `Aujourd’hui, nous sommes le ${today === 1 ? '1er' : today} ${month}. ${rng.pick(EVENTS).replace(/^./, (c) => c.toUpperCase())} est le ${event} ${month}.`,
        prompt: 'C’est dans {?} jours.',
        picture: { ...picture, marks: [today, event] },
        data: { answer: event - today, how: `${event} − ${today} = ${event - today}` },
      };
    }
    const weekday = rng.int(0, 6);
    const days = daysOn(page, weekday);
    const kind = rng.pick(['weekdays', 'length', 'nth'] as const);
    if (kind === 'weekdays')
      return {
        ...base,
        prompt: `En ${month}, il y a {?} ${plural(weekday)}.`,
        picture,
        data: {
          answer: days.length,
          how: `Je compte les cases de la colonne des ${plural(weekday)} : ${days.join(', ')}.`,
        },
      };
    if (kind === 'length') {
      const length = daysInMonth(page.year, page.month);
      return {
        ...base,
        prompt: `Le mois de ${month} a {?} jours.`,
        picture,
        data: { answer: length, how: `Le dernier jour du mois est le ${length}.` },
      };
    }
    const rank = rng.int(0, 2);
    return {
      ...base,
      prompt: `Le ${ORDINALS[rank]} ${WEEKDAYS[weekday]} de ${month}, c’est le {?}.`,
      picture,
      data: {
        answer: days[rank]!,
        how: `Dans la colonne des ${plural(weekday)}, je descends jusqu’à la ${rank === 0 ? '1re' : `${rank + 1}e`} case : ${days.slice(0, rank + 1).join(', ')}.`,
      },
    };
  },

  solve: (q) => ({ value: String(q.data.answer) }),

  explain: (q) => q.data.how,
});
