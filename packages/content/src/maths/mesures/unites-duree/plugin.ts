import { defineLevels, definePlugin, type Rng } from '@app/core';

// « 1 heure = … minutes » : les unités de durée, puis de petites conversions.

interface Params {
  kind: 'faits' | 'conversions';
}

interface Data {
  values: number[];
  explanation: string;
}

interface Fact {
  /** Le texte avec ses trous {0}, {1} ; values : ce qu'il faut écrire dedans. */
  prompt: string;
  values: number[];
  explanation: string;
}

const FACTS: Fact[] = [
  {
    prompt: '1 heure = {0} minutes',
    values: [60],
    explanation: 'En 1 heure, la grande aiguille fait un tour : 60 minutes.',
  },
  {
    prompt: '1 jour = {0} heures',
    values: [24],
    explanation: 'En 1 jour, la petite aiguille fait deux tours : 12 + 12 = 24 heures.',
  },
  {
    prompt: 'une demi-heure = {0} minutes',
    values: [30],
    explanation: 'La moitié de 60 minutes, c’est 30 minutes.',
  },
  {
    prompt: 'un quart d’heure = {0} minutes',
    values: [15],
    explanation: 'Un quart d’heure, c’est 60 minutes partagées en 4 : 15 minutes.',
  },
  {
    prompt: 'trois quarts d’heure = {0} minutes',
    values: [45],
    explanation: '15 + 15 + 15 = 45 minutes.',
  },
  {
    prompt: '1 semaine = {0} jours',
    values: [7],
    explanation: 'Lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche : 7 jours.',
  },
  { prompt: '60 minutes = {0} heure', values: [1], explanation: '60 minutes, c’est 1 heure.' },
  { prompt: '24 heures = {0} jour', values: [1], explanation: '24 heures, c’est 1 jour.' },
];

function conversion(rng: Rng): Fact {
  switch (rng.int(0, 3)) {
    case 0: {
      const h = rng.int(2, 4);
      return {
        prompt: `${h} heures = {0} minutes`,
        values: [h * 60],
        explanation: `1 heure = 60 minutes, donc ${h} heures = ${Array(h).fill(60).join(' + ')} = ${h * 60} minutes.`,
      };
    }
    case 1: {
      const m = rng.pick([10, 15, 20, 30, 40, 45]);
      return {
        prompt: `1 h ${m} min = {0} min`,
        values: [60 + m],
        explanation: `1 h = 60 min, donc 1 h ${m} min = 60 + ${m} = ${60 + m} min.`,
      };
    }
    case 2: {
      const m = rng.pick([5, 10, 15, 20, 30, 40, 45, 50]);
      return {
        prompt: `${60 + m} min = {0} h {1} min`,
        values: [1, m],
        explanation: `${60 + m} = 60 + ${m}, et 60 min = 1 h : ${60 + m} min = 1 h ${m} min.`,
      };
    }
    default: {
      const d = rng.int(2, 3);
      return {
        prompt: `${d} jours = {0} heures`,
        values: [d * 24],
        explanation: `1 jour = 24 heures, donc ${d} jours = ${Array(d).fill(24).join(' + ')} = ${d * 24} heures.`,
      };
    }
  }
}

export default definePlugin<'fill-blank', Params, Data>('fill-blank', {
  id: 'maths.mesures.unites-duree',
  version: 1,
  title: 'Heures et minutes',
  description: '1 heure = 60 minutes, 1 jour = 24 heures : complète.',
  icon: '⏳',
  notions: ['maths.mesures.durees'],
  expectedLevel: 1,
  minVariety: 8,
  levels: defineLevels<Params>([
    { label: 'Les unités de durée', grade: 'CE1', params: { kind: 'faits' } },
    { label: 'Petites conversions', grade: 'CE2', params: { kind: 'conversions' } },
  ]),

  generate({ rng, params }) {
    const fact = params.kind === 'faits' ? rng.pick(FACTS) : conversion(rng);
    return {
      widget: 'fill-blank',
      instruction: 'COMPLÈTE.',
      prompt: fact.prompt,
      blanks: fact.values.map(() => ({ kind: 'text' as const, size: 3, digits: true })),
      data: { values: fact.values, explanation: fact.explanation },
    };
  },

  solve: (q) => ({ values: q.data.values.map(String) }),

  explain: (q) => q.data.explanation,

  signature: (q) => q.prompt,
});
