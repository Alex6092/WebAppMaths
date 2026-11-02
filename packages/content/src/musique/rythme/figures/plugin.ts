import { defineLevels, definePlugin, figureName } from '@app/core';
import { MUSIC_GRADE as G, staff } from '../../lib/notes';
import { GROUPS, type Group } from '../../lib/rythme';

// « Comment s'appelle cette figure ? » : une figure de note ou un silence, et son nom à cocher.

interface Params {
  figures: string[];
}
interface Data {
  answer: string;
}

/** Le nom d'un groupe : « blanche », « deux croches », « noire pointée ». */
function groupName(g: Group): string {
  if (g.length === 2 && g[0]!.dur === 'e' && !g[0]!.rest) return 'deux croches';
  if (g.length === 4) return 'quatre doubles croches';
  return figureName(g[0]!);
}

const SINGLE = {
  demiSoupir: [{ dur: 'e', rest: true }] as Group,
  noirePointee: [{ dur: 'q', dot: true }] as Group,
  croche: [{ dur: 'e' }] as Group,
};
const FIG: Record<string, Group> = { ...GROUPS, ...SINGLE };

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'musique.rythme.figures',
  version: 1,
  title: 'Les figures de notes',
  description: 'Coche le nom de la note ou du silence.',
  icon: '🥁',
  notions: ['musique.rythme.figures'],
  expectedLevel: 3,
  minVariety: 3,
  levels: defineLevels<Params>([
    {
      label: 'Ronde, blanche, noire',
      grade: G,
      params: { figures: ['ronde', 'blanche', 'noire'] },
    },
    {
      label: 'La croche',
      grade: G,
      params: { figures: ['ronde', 'blanche', 'noire', 'croche', 'croches'] },
    },
    { label: 'Les silences', grade: G, params: { figures: ['pause', 'demiPause', 'soupir'] } },
    {
      label: 'Le demi-soupir',
      grade: G,
      params: { figures: ['pause', 'demiPause', 'soupir', 'demiSoupir', 'noire', 'croche'] },
    },
    {
      label: 'Les notes pointées',
      grade: G,
      params: { figures: ['blanche', 'noire', 'blanchePointee', 'noirePointee', 'ronde'] },
    },
    {
      label: 'La double croche',
      grade: G,
      params: { figures: ['croche', 'croches', 'doubles', 'noire', 'demiSoupir', 'soupir'] },
    },
  ]),

  generate({ rng, params }) {
    const figure = rng.pick(params.figures);
    const answer = groupName(FIG[figure]!);
    const names = [...new Set(params.figures.map((f) => groupName(FIG[f]!)))];
    const others = rng.sample(
      names.filter((n) => n !== answer),
      Math.min(3, names.length - 1),
    );
    return {
      widget: 'mcq',
      instruction: 'COCHE le nom de ce que tu vois.',
      picture: staff('rhythm', FIG[figure]!),
      choices: rng.shuffle([answer, ...others]).map((n) => ({ id: n, label: n })),
      multiple: false,
      layout: 'grid',
      data: { answer },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),

  explain(q) {
    const name = q.data.answer;
    if (/^(deux|quatre)/.test(name)) return `Ce sont ${name}.`;
    return `C’est ${/soupir/.test(name) ? 'un' : 'une'} ${name}.`;
  },
});
