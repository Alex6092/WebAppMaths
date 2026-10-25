import type { GradeId } from './grades';

/** Matière : maths, français… */
export interface Subject {
  id: string;
  title: string;
  icon: string;
  color: string;
  order: number;
}

/** Domaine (thématique) d'une matière : conjugaison, géométrie… */
export interface Domain {
  id: string;
  subject: string;
  title: string;
  icon: string;
  order: number;
}

/**
 * Notion : l'unité dont on suit l'acquisition. Elle correspond à une ligne de compétence
 * des évaluations de l'école (« Identifier le verbe conjugué dans une phrase »).
 */
export interface Notion {
  id: string;
  domain: string;
  title: string;
  /** Classes où la notion est travaillée. */
  grades: GradeId[];
  /** Libellé de compétence, tel qu'il apparaît sur les évaluations. */
  competence?: string;
  /** Mini-leçon (Markdown). */
  lesson?: string;
}

export interface Catalog {
  subjects: Subject[];
  domains: Domain[];
  notions: Notion[];
}
