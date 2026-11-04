/** Avatars des profils (famille et école). */
export const AVATARS = [
  '🦄',
  '🐱',
  '🐶',
  '🦊',
  '🐼',
  '🐸',
  '🐵',
  '🦁',
  '🐯',
  '🐰',
  '🐻',
  '🐨',
  '🐧',
  '🦋',
  '🐢',
  '🐬',
  '🦖',
  '🐙',
] as const;

/** L'année scolaire d'une date (« 2026-2027 ») : elle commence le 1er août. */
export function schoolYearOf(date: Date): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 7 ? y : y - 1;
  return `${start}-${start + 1}`;
}

/** Le dernier instant de l'année scolaire (31 août, 23 h 59). */
export function schoolYearEnd(schoolYear: string): Date {
  const end = Number(schoolYear.split('-')[1]);
  return new Date(end, 7, 31, 23, 59, 59);
}

/** Les avis de l'enseignant ECA ou NA restent « à retravailler » pendant 6 semaines. */
export const REWORK_DAYS = 42;
