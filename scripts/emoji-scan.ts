/** Liste des emoji utilisés par l'app (partagé par gen-emoji.ts et son test). */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const emojiDir = join(root, 'apps', 'web', 'src', 'emoji');

const SCANNED = [
  'apps/web/src',
  'apps/web/index.html',
  'packages/content/src',
  'packages/themes/src',
  'packages/core/src',
];
// Emoji et lettres des drapeaux.
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu;
// Caractères qui forment les séquences : variation emoji, liaison, touche.
const JOINERS = [0xfe0f, 0x200d, 0x20e3];

function filesOf(path: string): string[] {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (path.endsWith('.html')) return [full];
  return (readdirSync(full, { recursive: true }) as string[])
    .filter((f) => /\.(ts|svelte)$/.test(f) && !f.startsWith('emoji'))
    .map((f) => join(full, f));
}

/** Points de code à mettre dans la police (les « emoji texte » © ® restent à la police normale). */
export function usedCodepoints(): number[] {
  const codepoints = new Set<number>(JOINERS);
  for (const file of SCANNED.flatMap(filesOf)) {
    for (const match of readFileSync(file, 'utf8').matchAll(EMOJI)) {
      codepoints.add(match[0].codePointAt(0)!);
    }
  }
  return [...codepoints].filter((c) => c > 0xff).sort((a, b) => a - b);
}

export const hex = (c: number) => `U+${c.toString(16).toUpperCase()}`;

export function emojiCss(codepoints: readonly number[]): string {
  return `/* Généré par scripts/gen-emoji.ts (npm run gen:emoji) : ne pas modifier à la main. */
@font-face {
  font-family: 'Cartable Emoji';
  font-display: swap;
  src: url(./emoji.woff2) format('woff2');
  unicode-range: ${codepoints.map(hex).join(', ')};
}
`;
}
