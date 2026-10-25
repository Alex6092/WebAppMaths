import type { CheckResult, Mark } from '../question';

/**
 * Correction commune aux widgets où chaque élément reçoit une catégorie (couleur, colonne)
 * ou rien (null). Score : (justes − fausses) / attendues, ramené entre 0 et 1.
 */
export function compareAssignments(
  expected: readonly (string | null)[],
  given: readonly (string | null)[],
): CheckResult {
  const marks: Record<string, Mark> = {};
  let hits = 0;
  let errors = 0;
  let wanted = 0;
  expected.forEach((want, i) => {
    const got = given[i] ?? null;
    if (want !== null) wanted++;
    if (got !== null && got === want) {
      marks[i] = 'ok';
      hits++;
    } else if (got !== null) {
      marks[i] = 'wrong';
      errors++;
    } else if (want !== null) {
      marks[i] = 'missing';
    }
  });
  const correct = errors === 0 && hits === wanted;
  return { correct, score: correct ? 1 : Math.max(0, hits - errors) / Math.max(1, wanted), marks };
}

/** Vérifie un tableau de catégories venu du réseau. */
export function isAssignment(
  value: unknown,
  length: number,
  allowed: ReadonlySet<string>,
): value is (string | null)[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((v) => v === null || (typeof v === 'string' && allowed.has(v)))
  );
}

/** Pour un nouvel essai : on garde ce qui est juste, on efface ce qui est faux. */
export function keepCorrect(
  given: readonly (string | null)[],
  result: CheckResult,
): (string | null)[] {
  return given.map((v, i) => (result.marks[i] === 'ok' ? v : null));
}
