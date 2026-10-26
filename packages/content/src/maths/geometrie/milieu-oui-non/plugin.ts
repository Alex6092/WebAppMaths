import { defineLevels, definePlugin, roundCm, type FigText } from '@app/core';
import { lengthText, sideOf, towards, YES_NO } from '../../lib/geometrie';

// GEOM 2, exercices 5 et 10 : « Le point M est-il le milieu du segment ? COCHE OUI ou NON. »

interface Params {
  /** Les longueurs sont écrites ; sinon, il faut les mesurer à la règle. */
  shown: boolean;
  /** « Léo dit : … A-t-il raison ? » */
  story: boolean;
}

interface Data {
  left: number;
  right: number;
}

const WIDTH = 15;
const HEIGHT = 3.5;
const FRIENDS = ['Léo', 'Inès', 'Tom', 'Jade', 'Hugo', 'Lina', 'Noé', 'Zoé'];

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'maths.geometrie.milieu-oui-non',
  version: 1,
  title: 'Est-ce le milieu ?',
  description: 'Compare les deux longueurs pour savoir si M est le milieu.',
  icon: '⚖️',
  notions: ['maths.geometrie.milieu-reconnaitre'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Les longueurs sont écrites', grade: 'CE1', params: { shown: true, story: false } },
    { label: 'A-t-il raison ?', grade: 'CE1', params: { shown: true, story: true } },
    { label: 'Je mesure avec la règle', grade: 'CE1', params: { shown: false, story: false } },
  ]),

  generate({ rng, params }) {
    const left = rng.int(2, 6);
    const right = rng.chance(0.5) ? left : rng.pick([2, 3, 4, 5, 6, 7].filter((n) => n !== left));
    const start = { x: roundCm((WIDTH - left - right) / 2), y: 1.4 };
    const m = towards(start, 0, left);
    const end = towards(m, 0, right);
    const texts: FigText[] = params.shown
      ? [lengthText(start, m, `${left} cm`), lengthText(m, end, `${right} cm`)]
      : [];
    const friend = rng.pick(FRIENDS);
    const he = ['Inès', 'Jade', 'Lina', 'Zoé'].includes(friend) ? 'elle' : 'il';
    return {
      widget: 'mcq',
      instruction: params.story
        ? `${friend} dit : « M est le milieu du segment [AB]. » A-t-${he} raison ?`
        : 'Le point M est-il le milieu du segment [AB] ? COCHE OUI ou NON.',
      figure: {
        width: WIDTH,
        height: HEIGHT,
        points: [
          { id: 'A', label: 'A', ...start, mark: 'tick', labelAt: sideOf(0) },
          { id: 'M', label: 'M', ...m, mark: 'tick', labelAt: sideOf(0) },
          { id: 'B', label: 'B', ...end, mark: 'tick', labelAt: sideOf(0) },
        ],
        segments: [{ from: 'A', to: 'B' }],
        ...(texts.length ? { texts } : {}),
        ...(params.shown ? {} : { ruler: true }),
      },
      choices: YES_NO,
      multiple: false,
      layout: 'row',
      data: { left, right },
    };
  },

  solve: (q) => ({ selected: [q.data.left === q.data.right ? 'oui' : 'non'] }),

  explain: (q) => {
    const { left, right } = q.data;
    return left === right
      ? `AM = ${left} cm et MB = ${right} cm : les deux segments ont la même longueur, M est le milieu.`
      : `Les deux segments n’ont pas la même longueur (${left} cm et ${right} cm) : M n’est pas le milieu.`;
  },
});
