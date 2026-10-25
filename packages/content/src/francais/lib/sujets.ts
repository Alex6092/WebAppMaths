import type { Person } from './conjugaison';

export interface SubjectEntry {
  text: string;
  person: Person;
  kind: 'pronoun' | 'name' | 'group';
  /** Un chat : il ne fait que les actions qui ont des compléments « animal ». */
  animal?: boolean;
}

const PRONOUNS: SubjectEntry[] = [
  { text: 'je', person: 0, kind: 'pronoun' },
  { text: 'tu', person: 1, kind: 'pronoun' },
  { text: 'il', person: 2, kind: 'pronoun' },
  { text: 'elle', person: 2, kind: 'pronoun' },
  { text: 'nous', person: 3, kind: 'pronoun' },
  { text: 'vous', person: 4, kind: 'pronoun' },
  { text: 'ils', person: 5, kind: 'pronoun' },
  { text: 'elles', person: 5, kind: 'pronoun' },
];

/** Prénoms variés, comme dans les évaluations de l'école. */
export const FIRST_NAMES = [
  'Léa',
  'Tom',
  'Inès',
  'Léo',
  'Maya',
  'Lina',
  'Hugo',
  'Nina',
  'Sam',
  'Zoé',
  'Jules',
  'Mia',
  'Paul',
  'Salim',
  'Tia',
  'Yanis',
  'Chloé',
  'Adam',
  'Emma',
  'Noah',
  'Jade',
  'Rayan',
  'Aya',
  'Malo',
  'Lou',
  'Ambre',
  'Ana',
  'Ibrahim',
] as const;

const GROUPS: SubjectEntry[] = [
  { text: 'papa', person: 2, kind: 'group' },
  { text: 'maman', person: 2, kind: 'group' },
  { text: 'la maîtresse', person: 2, kind: 'group' },
  { text: 'mon frère', person: 2, kind: 'group' },
  { text: 'ma sœur', person: 2, kind: 'group' },
  { text: 'mamie', person: 2, kind: 'group' },
  { text: 'papy', person: 2, kind: 'group' },
  { text: 'le facteur', person: 2, kind: 'group' },
  { text: 'mon cousin', person: 2, kind: 'group' },
  { text: 'la voisine', person: 2, kind: 'group' },
  { text: 'le chat', person: 2, kind: 'group', animal: true },
  { text: 'le chaton', person: 2, kind: 'group', animal: true },
  { text: 'les enfants', person: 5, kind: 'group' },
  { text: 'les élèves', person: 5, kind: 'group' },
  { text: 'mes parents', person: 5, kind: 'group' },
  { text: 'mes cousins', person: 5, kind: 'group' },
  { text: 'les filles', person: 5, kind: 'group' },
  { text: 'les voisins', person: 5, kind: 'group' },
  { text: 'les chats', person: 5, kind: 'group', animal: true },
  { text: 'les chatons', person: 5, kind: 'group', animal: true },
];

export const SUBJECTS: readonly SubjectEntry[] = [
  ...PRONOUNS,
  ...FIRST_NAMES.map((text): SubjectEntry => ({ text, person: 2, kind: 'name' })),
  ...GROUPS,
];
