import { describe, expect, it } from 'vitest';
import { chunks } from './tts';

describe('morceaux à lire', () => {
  it('garde une phrase courte entière', () => {
    expect(chunks('COCHE le bon jour.')).toEqual(['COCHE le bon jour.']);
  });

  it('coupe une longue leçon entre deux phrases, 300 caractères au plus', () => {
    const lesson = Array.from(
      { length: 12 },
      (_, i) => `Voici la phrase numéro ${i} de la leçon.`,
    ).join(' ');
    const parts = chunks(lesson);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((p) => p.length <= 300 && p.endsWith('.'))).toBe(true);
    expect(parts.join(' ')).toBe(lesson);
  });

  it('coupe entre deux mots une phrase trop longue', () => {
    const long = `${'mot '.repeat(120)}fin.`;
    const parts = chunks(long);
    expect(parts.every((p) => p.length <= 300)).toBe(true);
    expect(parts.join(' ')).toBe(long);
  });
});
