import { defineLevels, definePlugin, type ClassifyCategory } from '@app/core';
import { determiner, group, nounsOf, type PluralRule } from '../../lib/pluriel';

// « RANGE au singulier ou au pluriel » : le petit mot devant le nom aide (des souris).

interface Params {
  rules: PluralRule[];
  count: number;
}

interface Data {
  /** La colonne de chaque étiquette. */
  placed: ('un' | 'plusieurs')[];
}

const CATEGORIES: ClassifyCategory[] = [
  { id: 'un', label: 'singulier (un seul)', color: '#e3f2fd' },
  { id: 'plusieurs', label: 'pluriel (plusieurs)', color: '#fce4ec' },
];

export default definePlugin<'classify', Params, Data>('classify', {
  id: 'francais.orthographe.singulier-pluriel',
  version: 1,
  title: 'Singulier ou pluriel ?',
  description: 'Un seul ou plusieurs ? Range les mots dans le tableau.',
  icon: '⚖️',
  notions: ['francais.orthographe.pluriel'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Avec un s ou un x', grade: 'CE1', params: { rules: ['s', 'x'], count: 6 } },
    {
      label: 'Avec les mots qui ne changent pas',
      grade: 'CE1',
      params: { rules: ['s', 'x', 'same'], count: 8 },
    },
  ]),

  generate({ rng, params }) {
    // Au niveau 2, il y a toujours un mot qui ne change pas (des souris, le nez).
    const tricky = params.rules.includes('same') ? rng.sample(nounsOf(['same']), 2) : [];
    const nouns = [
      ...tricky,
      ...rng.sample(
        nounsOf(params.rules).filter((n) => !tricky.includes(n)),
        params.count - tricky.length,
      ),
    ];
    const plural = rng.shuffle(nouns.map((_, i) => i % 2 === 0));
    const items = rng.shuffle(
      nouns.map((noun, i) => ({
        text: group(determiner(rng, noun, plural[i]!), plural[i] ? noun.plur : noun.sing),
        many: plural[i]!,
      })),
    );
    return {
      widget: 'classify',
      instruction: 'RANGE les mots : un seul (singulier) ou plusieurs (pluriel) ?',
      layout: 'columns',
      items: items.map((i) => ({ text: i.text })),
      categories: CATEGORIES,
      data: { placed: items.map((i) => (i.many ? 'plusieurs' : 'un')) },
    };
  },

  solve: (q) => ({ placed: [...q.data.placed] }),

  explain: () =>
    'Regarde le petit mot devant le nom : un, une, le, la, mon… pour un seul ; des, les, mes, deux… pour plusieurs.',
});
