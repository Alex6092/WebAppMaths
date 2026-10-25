/** Classes, du CP à la 3e. L'ordre du tableau est l'ordre de la scolarité. */
export const GRADES = [
  { id: 'CP', label: 'CP', cycle: 2 },
  { id: 'CE1', label: 'CE1', cycle: 2 },
  { id: 'CE2', label: 'CE2', cycle: 2 },
  { id: 'CM1', label: 'CM1', cycle: 3 },
  { id: 'CM2', label: 'CM2', cycle: 3 },
  { id: '6e', label: '6e', cycle: 3 },
  { id: '5e', label: '5e', cycle: 4 },
  { id: '4e', label: '4e', cycle: 4 },
  { id: '3e', label: '3e', cycle: 4 },
] as const;

export type GradeId = (typeof GRADES)[number]['id'];

export const GRADE_IDS: readonly GradeId[] = GRADES.map((g) => g.id);

export function isGrade(value: unknown): value is GradeId {
  return typeof value === 'string' && (GRADE_IDS as readonly string[]).includes(value);
}

/** Position dans la scolarité (CP = 0). */
export function gradeIndex(id: GradeId): number {
  return GRADE_IDS.indexOf(id);
}
