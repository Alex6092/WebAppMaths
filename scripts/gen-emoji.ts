/**
 * Génère la police emoji embarquée (apps/web/src/emoji/) : seulement les emoji utilisés par
 * l'app, extraits de Noto Color Emoji au format COLR. Chrome sait dessiner ce format partout,
 * même sous Windows 8.1, dont la police emoji ne connaît pas les emoji récents.
 *
 *   npm run gen:emoji
 *
 * À lancer après avoir ajouté un emoji (le test scripts/emoji.test.ts le rappelle).
 * Demande Python avec fontTools : `pip install fonttools brotli` (variable PYTHON pour en
 * choisir un autre). Le résultat est commité : la CI et le serveur n'ont pas besoin de Python.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { emojiCss, emojiDir, hex, usedCodepoints } from './emoji-scan';

const require = createRequire(import.meta.url);
const source = join(
  dirname(require.resolve('@fontsource/noto-color-emoji/package.json')),
  'files',
  'noto-color-emoji-emoji-400-normal.woff2',
);

const codepoints = usedCodepoints();
const css = emojiCss(codepoints);
const cssPath = join(emojiDir, 'emoji.css');
const fontPath = join(emojiDir, 'emoji.woff2');

if (existsSync(fontPath) && existsSync(cssPath) && readFileSync(cssPath, 'utf8') === css) {
  console.log('emoji : à jour');
  process.exit(0);
}

const candidates = [process.env.PYTHON, 'py', 'python3', 'python'].filter(Boolean) as string[];
const python = candidates.find((cmd) => {
  try {
    execFileSync(cmd, ['-c', 'import fontTools.subset, brotli'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});
if (!python) {
  console.error(
    'fontTools introuvable : pip install fonttools brotli (ou PYTHON=chemin/vers/python)',
  );
  process.exit(1);
}

mkdirSync(emojiDir, { recursive: true });
execFileSync(
  python,
  [
    '-m',
    'fontTools.subset',
    source,
    `--unicodes=${codepoints.map(hex).join(',')}`,
    '--layout-features=*',
    // La table SVG ne sert pas à Chrome et pèse lourd ; COLR et CPAL sont gardées.
    '--drop-tables+=SVG',
    '--flavor=woff2',
    `--output-file=${fontPath}`,
  ],
  { stdio: 'inherit' },
);
writeFileSync(cssPath, css);
// Noto Color Emoji est sous licence SIL OFL : la licence accompagne la police.
copyFileSync(join(dirname(source), '..', 'LICENSE'), join(emojiDir, 'LICENSE-OFL.txt'));
const size = Math.round(readFileSync(fontPath).length / 1024);
console.log(`emoji : ${codepoints.length - 3} emoji, ${size} Ko`);
