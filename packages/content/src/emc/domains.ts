import type { Domain, Notion } from '@app/core';

export const DELEGATE_NOTION = 'emc.vie-classe.delegues';

export const domains: Domain[] = [
  { id: 'emc.vie-classe', subject: 'emc', title: 'Vie de classe', icon: '🏫', order: 1 },
];

export const notions: Notion[] = [
  {
    id: DELEGATE_NOTION,
    domain: 'emc.vie-classe',
    title: 'Les délégués de classe',
    grades: ['CE1'],
    competence: 'Connaître les missions et les qualités des délégués de classe.',
    lesson: [
      'Les délégués sont les **porte-parole** de la classe. Ils écoutent **tous** leurs camarades, recueillent leurs idées et les présentent. Ils expliquent ensuite à la classe les décisions et les projets.',
      {
        kind: 'table',
        columns: [
          {
            title: 'Conseil de classe',
            cells: ['Les élèves parlent des idées et des projets de leur classe.'],
          },
          {
            title: 'Conseil des délégués de l’école',
            cells: ['Les délégués des classes discutent de projets pour l’école.'],
          },
        ],
      },
      'Un délégué est **à l’écoute** et **bienveillant**. Il prend des notes, prépare le conseil, parle poliment et rapporte les idées des autres avec leurs mots.',
      'Si un camarade lui confie un souci, il l’écoute avec discrétion. Si la situation l’inquiète ou s’il a besoin d’aide, il en parle à un adulte de confiance à l’école.',
      '**À discuter en classe.** Quelle idée aimerais-tu proposer si tu étais délégué ou déléguée ?',
    ],
  },
];
