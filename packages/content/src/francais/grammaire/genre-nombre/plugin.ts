import { defineLevels, definePlugin } from '@app/core';
import {
  definite,
  DETERMINANT_NOTION,
  indefinite,
  joinDet,
  pickNoun,
  startsWithVowel,
} from '../../lib/nom-determinant';

// Leçon « Le déterminant » : il permet de savoir si le nom est masculin ou féminin, et s'il est
// singulier ou pluriel.

type Ask = 'genre' | 'nombre';

interface Params {
  ask: Ask;
  count: number;
}

interface Data {
  placed: string[];
}

const CATEGORIES: Record<Ask, { id: string; label: string; color: string }[]> = {
  genre: [
    { id: 'm', label: 'masculin', color: '#bbdefb' },
    { id: 'f', label: 'féminin', color: '#f8bbd0' },
  ],
  nombre: [
    { id: 's', label: 'singulier', color: '#fff3e0' },
    { id: 'p', label: 'pluriel', color: '#e1bee7' },
  ],
};

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.grammaire.genre-nombre',
  version: 1,
  title: 'Masculin ou féminin ? Singulier ou pluriel ?',
  description: 'Le déterminant m’aide : le chat, la fleur, les ballons.',
  icon: '🔍',
  notions: [DETERMINANT_NOTION],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Masculin ou féminin', grade: 'CE1', params: { ask: 'genre', count: 6 } },
    { label: 'Singulier ou pluriel', grade: 'CE1', params: { ask: 'nombre', count: 6 } },
  ]),

  generate({ rng, params }) {
    const genre = params.ask === 'genre';
    const used = new Set<string>();
    const items = Array.from({ length: params.count }, (_, i) => {
      // Au moins un de chaque catégorie : les deux premiers sont imposés.
      const flag = i < 2 ? i === 1 : rng.chance(0.5);
      // « l’arbre » ne dit pas si le nom est masculin ou féminin.
      const noun = pickNoun(
        rng,
        (n) => !used.has(n.sing) && (!genre || (n.f === flag && !startsWithVowel(n.sing))),
      );
      used.add(noun.sing);
      const plural = !genre && flag;
      const det = rng.chance(0.5) ? definite(noun, plural) : indefinite(noun, plural);
      return {
        text: joinDet(det, plural ? noun.plur : noun.sing),
        id: genre ? (noun.f ? 'f' : 'm') : plural ? 'p' : 's',
      };
    });
    const shuffled = rng.shuffle(items);
    return {
      widget: 'classify',
      instruction: genre
        ? 'Regarde le déterminant. COCHE masculin ou féminin.'
        : 'Regarde le déterminant. COCHE singulier ou pluriel.',
      layout: 'table',
      items: shuffled.map(({ text }) => ({ text })),
      categories: CATEGORIES[params.ask],
      data: { placed: shuffled.map(({ id }) => id) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: (q) =>
    q.categories[0]!.id === 'm'
      ? 'Le, un : le nom est masculin. La, une : le nom est féminin.'
      : 'Le, la, l’, un, une : un seul, c’est le singulier. Les, des : plusieurs, c’est le pluriel.',
});
