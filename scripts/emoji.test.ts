import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { emojiCss, emojiDir, usedCodepoints } from './emoji-scan';

it('la police emoji embarquée contient tous les emoji de l’app (sinon : npm run gen:emoji)', () => {
  const css = join(emojiDir, 'emoji.css');
  expect(existsSync(join(emojiDir, 'emoji.woff2'))).toBe(true);
  expect(readFileSync(css, 'utf8')).toBe(emojiCss(usedCodepoints()));
});
