import { describe, expect, it } from 'vitest';
import { distanceToLine, distanceToSegment, projectOnLine } from '../geometry';
import type { GeometryAnswer, GeometryQuestion } from '../question';
import { checkGeometry, geometryWidget, sameDrawing } from './geometry';

const figure = {
  width: 10,
  height: 6,
  points: [
    { id: 'A', x: 1, y: 1 },
    { id: 'B', x: 3, y: 2 },
    { id: 'C', x: 5, y: 3 },
    { id: 'D', x: 7, y: 4 },
    { id: 'E', x: 4, y: 5 },
  ],
};

const empty = (): GeometryAnswer => ({ picked: [], drawn: [], placed: [] });

describe('calculs de géométrie', () => {
  it('mesure les distances à une droite et à un segment', () => {
    expect(distanceToLine({ x: 0, y: 2 }, { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(2);
    expect(distanceToSegment({ x: 7, y: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 })).toBe(3);
    expect(projectOnLine({ x: 2, y: 5 }, { x: 0, y: 0 }, { x: 4, y: 0 })).toEqual({
      x: 2,
      y: 0,
      t: 0.5,
    });
  });
});

describe('geometry', () => {
  it('reconnaît une même droite tracée par deux autres points alignés', () => {
    const q: GeometryQuestion = {
      widget: 'geometry',
      instruction: 'RELIE',
      figure,
      tools: [{ kind: 'draw', as: 'line' }],
    };
    expect(sameDrawing(q, ['A', 'B'], ['D', 'C'], 'line')).toBe(true);
    expect(sameDrawing(q, ['A', 'B'], ['D', 'C'], 'segment')).toBe(false);
    expect(sameDrawing(q, ['A', 'B'], ['A', 'E'], 'line')).toBe(false);
    const r = checkGeometry(
      q,
      { ...empty(), drawn: [['A', 'B']] },
      { ...empty(), drawn: [['C', 'D']] },
    );
    expect(r).toMatchObject({ correct: true, score: 1, marks: { 'd:0': 'ok' } });
  });

  it('corrige les points entourés et les tracés en trop', () => {
    const q: GeometryQuestion = {
      widget: 'geometry',
      instruction: 'TRACE et ENTOURE',
      figure,
      tools: [
        { kind: 'draw', as: 'segment' },
        { kind: 'pick', targets: ['B', 'C', 'E'] },
      ],
    };
    const expected = { ...empty(), picked: ['B', 'C'], drawn: [['A', 'D']] as [string, string][] };
    const r = checkGeometry(q, expected, {
      ...empty(),
      picked: ['B', 'E'],
      drawn: [
        ['D', 'A'],
        ['A', 'E'],
      ],
    });
    expect(r.correct).toBe(false);
    expect(r.marks).toMatchObject({
      'p:B': 'ok',
      'p:C': 'missing',
      'p:E': 'wrong',
      'd:0': 'ok',
      'd:1': 'wrong',
    });
    expect(geometryWidget.retryAnswer(q, { ...empty(), picked: ['B', 'E'] }, r).picked).toEqual([
      'B',
    ]);
  });

  it('accepte un point placé dans la tolérance, ou selon la règle du plugin', () => {
    const q: GeometryQuestion = {
      widget: 'geometry',
      instruction: 'PLACE',
      figure,
      tools: [{ kind: 'place', labels: ['M'] }],
      tolerance: 0.3,
    };
    const expected = { ...empty(), placed: [{ id: 'M', x: 4, y: 2.5 }] };
    const near = { ...empty(), placed: [{ id: 'M', x: 4.2, y: 2.5 }] };
    const far = { ...empty(), placed: [{ id: 'M', x: 4.5, y: 2.5 }] };
    expect(checkGeometry(q, expected, near).correct).toBe(true);
    expect(checkGeometry(q, expected, far).marks['l:M']).toBe('wrong');
    expect(checkGeometry(q, expected, empty()).marks['l:M']).toBe('missing');
    expect(checkGeometry(q, expected, far, { placed: (p) => p.x > 4 }).correct).toBe(true);
    expect(geometryWidget.isComplete(q, empty())).toBe(false);
    expect(geometryWidget.isComplete(q, near)).toBe(true);
  });

  it('refuse les réponses mal formées', () => {
    const q: GeometryQuestion = {
      widget: 'geometry',
      instruction: 'PLACE',
      figure,
      tools: [
        { kind: 'place', labels: ['M'] },
        { kind: 'draw', as: 'line', help: true },
      ],
    };
    expect(geometryWidget.validate(q, empty())).toBe(true);
    expect(geometryWidget.validate(q, { ...empty(), placed: [{ id: 'Z', x: 1, y: 1 }] })).toBe(
      false,
    );
    expect(geometryWidget.validate(q, { ...empty(), placed: [{ id: 'M', x: 99, y: 1 }] })).toBe(
      false,
    );
    expect(geometryWidget.validate(q, { ...empty(), drawn: [['A', 'A']] })).toBe(false);
    expect(geometryWidget.validate(q, { ...empty(), picked: ['A'] })).toBe(false);
    // Un trait d'aide n'est pas demandé : la réponse est complète sans lui.
    expect(geometryWidget.isComplete(q, { ...empty(), placed: [{ id: 'M', x: 1, y: 1 }] })).toBe(
      true,
    );
  });
});
