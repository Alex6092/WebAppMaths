/**
 * Fabrique les icônes PNG de l'app (installation sur Windows, Android et iPad) à partir de
 * apps/web/icons/icon.svg, avec le Chromium de Playwright. À relancer après avoir changé le SVG :
 *   npm run gen:icons
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'apps/web/public/icons');
const source = readFileSync(join(ROOT, 'apps/web/icons/icon.svg'), 'utf8');

/** Fond plein carré : l'iPad et Android arrondissent eux-mêmes les coins. */
const fullBleed = source.replace(/(<rect id="bg"[^>]*?) rx="\d+"/, '$1');
/** Icône « maskable » : le dessin tient dans le cercle central (80 %) que garde Android. */
const maskable = fullBleed.replace(
  '<g id="art">',
  '<g id="art" transform="translate(51.2 51.2) scale(0.8)">',
);

const ICONS: [file: string, svg: string, size: number][] = [
  ['icon-192.png', source, 192],
  ['icon-512.png', source, 512],
  ['maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', maskable, 180],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [file, svg, size] of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const sized = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setContent(`<style>body{margin:0}</style>${sized}`);
  writeFileSync(join(OUT, file), await page.locator('svg').screenshot({ omitBackground: true }));
  await page.close();
}
writeFileSync(join(OUT, 'icon.svg'), source);
await browser.close();
console.log(`${ICONS.length} icônes écrites dans ${OUT}`);
