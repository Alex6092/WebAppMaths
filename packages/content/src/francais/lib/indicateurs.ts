import type { Moment } from './conjugaison';

/** Indicateurs de temps de la leçon CONJ 2 (et quelques autres du même genre). */
export interface Indicator {
  text: string;
  moment: Moment;
  /** Peut se placer en fin de phrase (« Nous lisons un livre en ce moment. »). */
  endOk: boolean;
  /** Fait partie du tableau de la leçon. */
  lesson?: boolean;
}

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export const INDICATORS: readonly Indicator[] = [
  { text: 'hier', moment: 'passe', endOk: false, lesson: true },
  { text: 'avant-hier', moment: 'passe', endOk: false, lesson: true },
  { text: 'il y a 2 jours', moment: 'passe', endOk: true, lesson: true },
  { text: 'il y a 3 jours', moment: 'passe', endOk: true },
  { text: 'la semaine dernière', moment: 'passe', endOk: true, lesson: true },
  { text: "l'année dernière", moment: 'passe', endOk: true },
  { text: 'autrefois', moment: 'passe', endOk: false, lesson: true },
  { text: 'jadis', moment: 'passe', endOk: false, lesson: true },
  ...DAYS.map((d) => ({
    text: `${d} dernier`,
    moment: 'passe' as const,
    endOk: true,
    lesson: d === 'samedi',
  })),
  { text: 'en ce moment', moment: 'present', endOk: true, lesson: true },
  { text: "aujourd'hui", moment: 'present', endOk: false, lesson: true },
  { text: 'actuellement', moment: 'present', endOk: false, lesson: true },
  { text: 'maintenant', moment: 'present', endOk: false, lesson: true },
  { text: 'demain', moment: 'futur', endOk: false, lesson: true },
  { text: 'après-demain', moment: 'futur', endOk: false, lesson: true },
  { text: 'dans 2 jours', moment: 'futur', endOk: true, lesson: true },
  { text: 'dans 3 jours', moment: 'futur', endOk: true },
  { text: 'la semaine prochaine', moment: 'futur', endOk: true, lesson: true },
  { text: "l'année prochaine", moment: 'futur', endOk: true },
  { text: 'dans quelques années', moment: 'futur', endOk: true, lesson: true },
  ...DAYS.map((d) => ({
    text: `${d} prochain`,
    moment: 'futur' as const,
    endOk: true,
    lesson: d === 'samedi',
  })),
];

export const LESSON_INDICATORS = INDICATORS.filter((i) => i.lesson);

/** Les trois indicateurs de l'exercice « COMPLÈTE avec hier, aujourd'hui ou demain ». */
export const SIMPLE_INDICATOR: Record<Moment, string> = {
  passe: 'hier',
  present: "aujourd'hui",
  futur: 'demain',
};

export function indicatorsOf(moment: Moment, lessonOnly = false): Indicator[] {
  return INDICATORS.filter((i) => i.moment === moment && (!lessonOnly || i.lesson));
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}
