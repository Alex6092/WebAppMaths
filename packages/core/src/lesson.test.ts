import { describe, expect, it } from 'vitest';
import { inlineParts, lessonErrors, lessonSpeech, plainText } from './lesson';

describe('textes de leçon', () => {
  it('reconnaît le gras, l’italique et le souligné', () => {
    expect(inlineParts('**gras** et *j’__allais__*')).toEqual([
      { text: 'gras', bold: true, italic: false, underline: false },
      { text: ' et ', bold: false, italic: false, underline: false },
      { text: 'j’', bold: false, italic: true, underline: false },
      { text: 'allais', bold: false, italic: true, underline: true },
    ]);
    expect(plainText('3 **<** 8')).toBe('3 < 8');
  });

  it('lit les signes et les illustrations avec des mots', () => {
    expect(
      lessonSpeech([
        'Le signe **<** :',
        { kind: 'example', lines: ['3 < 8', '3 × 4 = 12'] },
        { kind: 'table', columns: [{ title: 'passé', cells: ['hier', 'jadis'] }] },
        { kind: 'base-ten', value: 307 },
        { kind: 'operation', op: '+', operands: [1, 2] },
      ]),
    ).toBe(
      'Le signe < : 3 est plus petit que 8. 3 fois 4 = 12. passé : hier, jadis. 3 centaines, 7 unités',
    );
  });

  it('signale une leçon mal écrite', () => {
    expect(lessonErrors(['du **gras'])).toHaveLength(1);
    expect(
      lessonErrors([
        {
          kind: 'figure',
          figure: {
            width: 5,
            height: 2,
            points: [{ id: 'A', x: 6, y: 1 }],
            segments: [{ from: 'A', to: 'B' }],
          },
        },
        { kind: 'number-line', from: 10, to: 20, step: 1, labels: [], points: [25] },
        { kind: 'base-ten', value: 1000 },
      ]),
    ).toHaveLength(4);
  });
});
