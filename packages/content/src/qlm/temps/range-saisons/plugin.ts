import { defineLevels, definePlugin } from '@app/core';
import {
  SEASON_COLOR,
  SEASON_ICON,
  SEASON_LABEL,
  SEASON_SCENES,
  SEASONS,
  type Season,
} from '../../lib/temps';

// « RANGE les images dans la bonne saison » : les fleurs au printemps, la luge en hiver.

interface Params {
  /** Le nombre d'images par saison. */
  each: number;
}

interface Data {
  placed: Season[];
}

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'qlm.temps.range-saisons',
  version: 1,
  title: 'Les quatre saisons',
  description: 'Les fleurs au printemps, la plage en été : range les images par saison.',
  icon: '🍂',
  notions: ['qlm.temps.mois-saisons'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Une image par saison', grade: 'CE1', params: { each: 1 } },
    { label: 'Deux images par saison', grade: 'CE1', params: { each: 2 } },
  ]),

  generate({ rng, params }) {
    const items = rng.shuffle(
      SEASONS.flatMap((season) =>
        rng.sample(SEASON_SCENES[season], params.each).map((scene) => ({ ...scene, season })),
      ),
    );
    return {
      widget: 'classify',
      instruction: 'RANGE chaque image dans sa saison.',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text, icon: i.icon })),
      categories: SEASONS.map((s) => ({
        id: s,
        label: `${SEASON_ICON[s]} ${SEASON_LABEL[s]}`,
        color: SEASON_COLOR[s],
      })),
      data: { placed: items.map((i) => i.season) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'Le printemps : les fleurs. L’été : la chaleur et la plage. L’automne : les feuilles tombent. L’hiver : le froid et la neige.',
});
