import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ce qui part dans le navigateur doit tourner sur les appareils d'Océane : Chrome 109 (Windows 8.1)
 * et Safari 15.4 (iPad). Une expression régulière inconnue fait planter toute l'app au chargement,
 * et le build ne la transforme pas : on la cherche dans les sources.
 */
const ROOT = join(import.meta.dirname, '..');
const BROWSER_SOURCES = [
  'apps/web/src',
  'packages/core/src',
  'packages/content/src',
  'packages/themes/src',
];

const FORBIDDEN: [RegExp, string][] = [
  [/\(\?<[=!]/, 'regard en arrière « (?<= » ou « (?<! » (Safari 16.4)'],
  [/AbortSignal\.timeout/, 'AbortSignal.timeout (Safari 16)'],
  [
    /\.toSorted\(|\.toReversed\(|\.toSpliced\(|Object\.groupBy|Promise\.withResolvers/,
    'API de 2023 (Chrome 110 et plus)',
  ],
];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(ts|svelte)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
  });
}

describe('compatibilité des navigateurs', () => {
  it('n’utilise rien que Chrome 109 et Safari 15.4 ne connaissent pas', () => {
    const found: string[] = [];
    for (const dir of BROWSER_SOURCES) {
      let list: string[];
      try {
        list = files(join(ROOT, dir));
      } catch {
        continue;
      }
      for (const file of list) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
            for (const [pattern, what] of FORBIDDEN) {
              if (pattern.test(line)) found.push(`${relative(ROOT, file)}:${i + 1} ${what}`);
            }
          });
      }
    }
    expect(found).toEqual([]);
  });
});
