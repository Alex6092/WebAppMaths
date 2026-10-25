import { describe, expect, it } from 'vitest';
import type { ColumnOpQuestion, McqQuestion } from '../question';
import { mathToSpeech } from '../speech';
import { columnLayout, columnOpWidget, columnSolution } from './column-op';
import { mcqWidget } from './mcq';
import { normalizeNumber } from './number-input';

const add = (...operands: number[]): ColumnOpQuestion => ({
  widget: 'column-op',
  instruction: 'CALCULE',
  op: '+',
  operands,
  showCarries: true,
});
const sub = (a: number, b: number): ColumnOpQuestion => ({ ...add(a, b), op: '-' });

describe('column-op', () => {
  it('place le résultat à droite avec une colonne de marge', () => {
    expect(columnLayout(add(47, 38))).toMatchObject({
      cols: 3,
      result: 85,
      expected: [null, 8, 5],
    });
    expect(columnLayout(add(3, 4)).expected).toEqual([null, 7]);
  });

  it('calcule les retenues d’une addition (comme l’app CP)', () => {
    expect(columnLayout(add(47, 38)).carries).toEqual([0, 1, 0]);
    expect(columnLayout(add(99, 99, 99)).carries).toEqual([2, 2, 0]);
  });

  it('calcule les retenues d’une soustraction', () => {
    expect(columnLayout(sub(52, 27))).toMatchObject({ expected: [null, 2, 5], carries: [0, 1, 0] });
    expect(columnLayout(sub(402, 157)).carries).toEqual([0, 1, 1, 0]);
  });

  it('corrige case par case', () => {
    const q = add(47, 38);
    const result = columnOpWidget.compare(q, columnSolution(q), {
      digits: ['', '8', '4'],
      carries: [0, 0, 0],
    });
    expect(result).toMatchObject({ correct: false, marks: { 1: 'ok', 2: 'wrong' } });
    expect(
      columnOpWidget.retryAnswer(q, { digits: ['', '8', '4'], carries: [0, 1, 0] }, result).digits,
    ).toEqual(['', '8', '']);
  });

  it('refuse une réponse mal formée', () => {
    const q = add(47, 38);
    expect(columnOpWidget.validate(q, { digits: ['', '8', '12'], carries: [0, 0, 0] })).toBe(false);
    expect(columnOpWidget.validate(q, { digits: ['', '8'], carries: [0, 0, 0] })).toBe(false);
    expect(columnOpWidget.validate(q, columnSolution(q))).toBe(true);
  });
});

describe('mcq', () => {
  const q: McqQuestion = {
    widget: 'mcq',
    instruction: 'COCHE',
    choices: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
    multiple: true,
  };

  it('donne un score partiel en choix multiple', () => {
    const r = mcqWidget.compare(q, { selected: ['a', 'b'] }, { selected: ['a', 'c'] });
    expect(r).toMatchObject({
      correct: false,
      score: 0,
      marks: { a: 'ok', b: 'missing', c: 'wrong' },
    });
    expect(mcqWidget.compare(q, { selected: ['a', 'b'] }, { selected: ['a'] }).score).toBe(0.5);
  });

  it('refuse les choix inconnus ou en double', () => {
    expect(mcqWidget.validate(q, { selected: ['z'] })).toBe(false);
    expect(mcqWidget.validate(q, { selected: ['a', 'a'] })).toBe(false);
    expect(mcqWidget.validate({ ...q, multiple: false }, { selected: ['a', 'b'] })).toBe(false);
  });
});

describe('number-input et lecture', () => {
  it('normalise les nombres saisis', () => {
    expect(normalizeNumber(' 012 ')).toBe('12');
    expect(normalizeNumber('1 000')).toBe('1000');
    expect(normalizeNumber('0')).toBe('0');
    expect(normalizeNumber('3,5')).toBe('3.5');
  });

  it('lit les écritures mathématiques', () => {
    expect(mathToSpeech('7 + {?} = 10')).toBe('7 plus combien égale 10');
    expect(mathToSpeech('52 − 27')).toBe('52 moins 27');
    expect(mathToSpeech('47 … 74')).toBe('47 74');
    expect(mathToSpeech('dix-sept')).toBe('dix-sept');
  });
});
