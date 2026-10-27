import { defineLevels, definePlugin } from '@app/core';
import {
  capitalized,
  MONTH_SEASON,
  MONTHS,
  SEASON_ICON,
  SEASON_IN,
  SEASON_LABEL,
  SEASON_OF,
  SEASONS,
  type Season,
} from '../../lib/temps';

// « En juillet, c'est quelle saison ? », puis « Quel mois est en hiver ? ».

interface Params {
  /** season : la saison d'un mois ; month : un mois de la saison. */
  ask: 'season' | 'month';
}

interface Data {
  month: number;
  season: Season;
}

/** Les mois tout entiers dans une saison (1 à 12). */
const MONTHS_IN = Object.entries(MONTH_SEASON).map(([m, s]) => ({ month: Number(m), season: s! }));

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'qlm.temps.saison-du-mois',
  version: 1,
  title: 'Les mois et les saisons',
  description: 'En juillet, c’est l’été ; en janvier, c’est l’hiver.',
  icon: '🌦️',
  notions: ['qlm.temps.mois-saisons'],
  expectedLevel: 2,
  minVariety: 8,
  levels: defineLevels<Params>([
    { label: 'La saison d’un mois', grade: 'CE1', params: { ask: 'season' } },
    { label: 'Un mois de la saison', grade: 'CE1', params: { ask: 'month' } },
  ]),

  generate({ rng, params }) {
    const { month, season } = rng.pick(MONTHS_IN);
    if (params.ask === 'season') {
      return {
        widget: 'mcq',
        instruction: 'COCHE la saison.',
        prompt: `En ${MONTHS[month - 1]}, c’est…`,
        choices: SEASONS.map((s) => ({ id: s, label: SEASON_LABEL[s], icon: SEASON_ICON[s] })),
        multiple: false,
        layout: 'grid',
        data: { month, season },
      };
    }
    // Un mois de chacune des autres saisons pour les pièges.
    const others = SEASONS.filter((s) => s !== season).map(
      (s) => rng.pick(MONTHS_IN.filter((m) => m.season === s)).month,
    );
    const choices = [month, ...others].sort((a, b) => a - b);
    return {
      widget: 'mcq',
      instruction: 'COCHE le bon mois.',
      prompt: `${SEASON_ICON[season]} Quel mois est ${SEASON_IN[season]} ?`,
      choices: choices.map((m) => ({ id: String(m), label: MONTHS[m - 1]! })),
      multiple: false,
      layout: 'grid',
      data: { month, season },
    };
  },

  solve: (q) => ({
    selected: [
      q.choices.some((c) => c.id === q.data.season) ? q.data.season : String(q.data.month),
    ],
  }),

  explain: (q) =>
    `${capitalized(MONTHS[q.data.month - 1]!)} est un mois ${SEASON_OF[q.data.season]}.`,
});
