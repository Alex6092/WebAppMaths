import { defineLevels, definePlugin, MONTHS, weekdayOf, WEEKDAYS } from '@app/core';
import { dateText, randomPage } from '../../lib/calendrier';
import { around } from '../../lib/temps';

// Lire le calendrier : « Le 12 mai, c'est quel jour ? », puis « Quelle est la date entourée ? ».

interface Params {
  /** weekday : le jour d'une date ; date : la date complète du jour entouré. */
  ask: 'weekday' | 'date';
}

interface Data {
  year: number;
  month: number;
  day: number;
  answer: string;
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.temps.jour-calendrier',
  version: 1,
  title: 'Lire le calendrier',
  description: 'Trouve le jour d’une date sur la page du mois.',
  icon: '📆',
  notions: ['qlm.temps.calendrier'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Le jour d’une date', grade: 'CE1', params: { ask: 'weekday' } },
    { label: 'La date entourée', grade: 'CE1', params: { ask: 'date' } },
  ]),

  generate({ rng, params }) {
    const page = randomPage(rng);
    const day = rng.int(2, 27);
    const weekday = weekdayOf(page.year, page.month, day);
    const month = MONTHS[page.month - 1]!;
    if (params.ask === 'weekday') {
      const options = [
        weekday,
        around(weekday, 1, 7),
        around(weekday, -1, 7),
        around(weekday, 2, 7),
      ];
      return {
        widget: 'mcq',
        instruction: 'REGARDE le calendrier et COCHE le bon jour.',
        prompt: `Le ${day} ${month}, c’est…`,
        picture: { kind: 'calendar', ...page },
        choices: options.sort((a, b) => a - b).map((d) => ({ id: String(d), label: WEEKDAYS[d]! })),
        multiple: false,
        layout: 'grid',
        data: { ...page, day, answer: String(weekday) },
      };
    }
    // La bonne date, et des pièges : le jour d'à côté, la date d'à côté.
    const labels = [
      dateText(page, day),
      `${WEEKDAYS[around(weekday, 1, 7)]} ${day} ${month}`,
      `${WEEKDAYS[around(weekday, -1, 7)]} ${day} ${month}`,
      `${WEEKDAYS[weekday]} ${day + rng.pick([-1, 1])} ${month}`,
    ];
    const choices = rng.shuffle(labels.map((label, i) => ({ id: String(i), label })));
    return {
      widget: 'mcq',
      instruction: 'REGARDE le calendrier et COCHE la date entourée.',
      picture: { kind: 'calendar', ...page, marks: [day] },
      choices,
      multiple: false,
      layout: 'list',
      data: { ...page, day, answer: '0' },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain: (q) =>
    `Je cherche le ${q.data.day} sur le calendrier, puis je regarde le jour en haut de sa colonne : c’est le ${dateText(q.data, q.data.day)}.`,
});
