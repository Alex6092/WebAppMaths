import { defineLevels, definePlugin } from '@app/core';
import { FLAW_REASON, flawedText, type Flaw } from '../../lib/phrase-defauts';

// Leçon « La phrase » : une phrase a un sens, commence par une majuscule, finit par un point.

interface Params {
  /** Défauts possibles (en plus de la phrase bien écrite). */
  flaws: Flaw[];
  /** Plusieurs phrases à cocher au lieu d'une seule à juger (0 : une seule). */
  many: number;
}

interface Data {
  flaws: Flaw[];
}

export default definePlugin<'mcq', Params, Data>('mcq', {
  id: 'francais.grammaire.est-ce-une-phrase',
  version: 1,
  title: 'Est-ce une phrase ?',
  description: 'Un sens, une majuscule et un point.',
  icon: '🔎',
  notions: ['francais.grammaire.phrase'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Est-ce que ça a un sens ?', grade: 'CE1', params: { flaws: ['order'], many: 0 } },
    {
      label: 'Le sens, la majuscule et le point',
      grade: 'CE1',
      params: { flaws: ['order', 'capital', 'point'], many: 0 },
    },
    {
      label: 'Coche les vraies phrases',
      grade: 'CE1',
      params: { flaws: ['order', 'capital', 'point'], many: 4 },
    },
  ]),

  generate({ rng, params }) {
    if (params.many > 0) {
      // Au moins une vraie phrase et au moins une fausse.
      const flaws = rng.shuffle<Flaw>([
        'none',
        rng.pick(params.flaws),
        ...Array.from({ length: params.many - 2 }, () => rng.pick<Flaw>(['none', ...params.flaws])),
      ]);
      return {
        widget: 'mcq',
        instruction: 'COCHE les vraies phrases.',
        choices: flaws.map((flaw, i) => ({ id: String(i), label: flawedText(rng, flaw, true) })),
        multiple: true,
        layout: 'list',
        data: { flaws },
      };
    }
    const flaw: Flaw = rng.chance(0.5) ? 'none' : rng.pick(params.flaws);
    return {
      widget: 'mcq',
      instruction: 'Est-ce une phrase ? Réponds OUI ou NON.',
      prompt: flawedText(rng, flaw, params.flaws.length > 1),
      choices: [
        { id: 'oui', label: 'OUI' },
        { id: 'non', label: 'NON' },
      ],
      multiple: false,
      layout: 'row',
      data: { flaws: [flaw] },
    };
  },

  solve(q) {
    if (q.multiple)
      return { selected: q.data.flaws.flatMap((f, i) => (f === 'none' ? [String(i)] : [])) };
    return { selected: [q.data.flaws[0] === 'none' ? 'oui' : 'non'] };
  },

  explain(q) {
    if (!q.multiple) return FLAW_REASON[q.data.flaws[0]!];
    return q.data.flaws
      .map((f, i) => (f === 'none' ? null : `« ${q.choices[i]!.label} » : ${FLAW_REASON[f]}`))
      .filter(Boolean)
      .join(' ');
  },

  signature: (q) => q.prompt ?? q.choices.map((c) => c.label).join('|'),
});
