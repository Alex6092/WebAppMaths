import type { ColumnOpAnswer, ColumnOpQuestion, Mark } from '../question';
import type { WidgetDef } from './types';

/** Nom des rangs, de droite à gauche : PLACE_NAMES[0] = unités. */
export const PLACE_NAMES = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille'];

export interface ColumnLayout {
  cols: number;
  result: number;
  /** Chiffre attendu par colonne (de gauche à droite), null pour une case qui reste vide. */
  expected: (number | null)[];
  /** Retenue reçue par chaque colonne. */
  carries: number[];
}

export function columnResult(q: ColumnOpQuestion): number {
  if (q.op === '+') return q.operands.reduce((sum, n) => sum + n, 0);
  const [first = 0, ...rest] = q.operands;
  return rest.reduce((diff, n) => diff - n, first);
}

/** Retenue reçue par chaque colonne d'une addition (fonctionne avec plus de deux nombres). */
export function additionCarries(operands: readonly number[], cols: number): number[] {
  const padded = operands.map((n) => String(n).padStart(cols, '0'));
  const carries = new Array<number>(cols).fill(0);
  let carry = 0;
  for (let i = cols - 1; i >= 0; i--) {
    carries[i] = carry;
    const sum = padded.reduce((s, digits) => s + Number(digits[i]), 0) + carry;
    carry = Math.floor(sum / 10);
  }
  return carries;
}

/** Retenue de chaque colonne d'une soustraction (méthode par compensation). */
export function subtractionCarries(a: number, b: number, cols: number): number[] {
  const da = String(a).padStart(cols, '0');
  const db = String(b).padStart(cols, '0');
  const carries = new Array<number>(cols).fill(0);
  let borrow = 0;
  for (let i = cols - 1; i >= 0; i--) {
    carries[i] = borrow;
    borrow = Number(da[i]) < Number(db[i]) + borrow ? 1 : 0;
  }
  return carries;
}

export function columnLayout(q: ColumnOpQuestion): ColumnLayout {
  const result = columnResult(q);
  const resultDigits = String(result);
  const widest = Math.max(...q.operands.map((n) => String(n).length));
  const cols = Math.max(resultDigits.length, widest + 1);
  const expected = Array.from({ length: cols }, (_, i) => {
    const offset = i - (cols - resultDigits.length);
    return offset >= 0 ? Number(resultDigits[offset]) : null;
  });
  const carries =
    q.op === '+'
      ? additionCarries(q.operands, cols)
      : subtractionCarries(q.operands[0] ?? 0, q.operands[1] ?? 0, cols);
  return { cols, result, expected, carries };
}

/** Nombre de colonnes qui reçoivent une retenue. */
export function countCarries(q: ColumnOpQuestion): number {
  return columnLayout(q).carries.filter((c) => c > 0).length;
}

export function columnSolution(q: ColumnOpQuestion): ColumnOpAnswer {
  const { expected, carries } = columnLayout(q);
  return { digits: expected.map((d) => (d === null ? '' : String(d))), carries };
}

export const columnOpWidget: WidgetDef<'column-op'> = {
  id: 'column-op',

  emptyAnswer(q) {
    const { cols } = columnLayout(q);
    return { digits: new Array<string>(cols).fill(''), carries: new Array<number>(cols).fill(0) };
  },

  validate(q, answer): answer is ColumnOpAnswer {
    const { cols } = columnLayout(q);
    if (typeof answer !== 'object' || answer === null) return false;
    const { digits, carries } = answer as Partial<ColumnOpAnswer>;
    return (
      Array.isArray(digits) &&
      digits.length === cols &&
      digits.every((d) => d === '' || (typeof d === 'string' && /^\d$/.test(d))) &&
      Array.isArray(carries) &&
      carries.length === cols &&
      carries.every((c) => Number.isInteger(c) && c >= 0 && c <= 9)
    );
  },

  isComplete(q, answer) {
    return columnLayout(q).expected.every((d, i) => d === null || (answer.digits[i] ?? '') !== '');
  },

  compare(_q, expected, given) {
    const marks: Record<string, Mark> = {};
    let total = 0;
    let ok = 0;
    expected.digits.forEach((digit, i) => {
      if (digit === '') return;
      total++;
      const value = given.digits[i] ?? '';
      if (value === '') marks[i] = 'missing';
      else if (value === digit) {
        marks[i] = 'ok';
        ok++;
      } else marks[i] = 'wrong';
    });
    return { correct: ok === total, score: total ? ok / total : 0, marks };
  },

  retryAnswer(_q, given, result) {
    return {
      digits: given.digits.map((d, i) => (result.marks[i] === 'ok' ? d : '')),
      carries: [...given.carries],
    };
  },

  speech(q) {
    return q.operands.join(q.op === '+' ? ' plus ' : ' moins ');
  },
};
