/**
 * Génère packages/content/src/registry.generated.ts à partir des dossiers :
 * - chaque `plugin.ts` est un type d'exercice ;
 * - chaque `domains.ts` déclare des domaines et des notions.
 * Lancé avant dev, build, test et typecheck : déposer un dossier suffit pour ajouter un exercice.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentSrc = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'packages',
  'content',
  'src',
);
const target = join(contentSrc, 'registry.generated.ts');

const files = (readdirSync(contentSrc, { recursive: true }) as string[])
  .map((f) => f.split('\\').join('/'))
  .sort();

const pluginFiles = files.filter((f) => f.endsWith('/plugin.ts'));
const domainFiles = files.filter((f) => f === 'domains.ts' || f.endsWith('/domains.ts'));

const importPath = (file: string) => './' + file.replace(/\.ts$/, '');
const lines = [
  '// Fichier généré par scripts/gen-registry.ts : ne pas modifier à la main.',
  "import type { AnyPlugin, Domain, Notion } from '@app/core';",
  '',
  ...pluginFiles.map((f, i) => `import plugin${i} from '${importPath(f)}';`),
  ...domainFiles.map((f, i) => `import * as domains${i} from '${importPath(f)}';`),
  '',
  'export const plugins: AnyPlugin[] = [',
  ...pluginFiles.map((_, i) => `  plugin${i},`),
  '];',
  '',
  '/** Identifiant attendu de chaque plugin, déduit de son dossier. */',
  'export const pluginPathIds: string[] = [',
  ...pluginFiles.map(
    (f) =>
      `  '${f
        .replace(/\/plugin\.ts$/, '')
        .split('/')
        .join('.')}',`,
  ),
  '];',
  '',
  'export const domainModules: { domains: Domain[]; notions: Notion[] }[] = [',
  ...domainFiles.map((_, i) => `  domains${i},`),
  '];',
  '',
];
const output = lines.join('\n');

if (!existsSync(target) || readFileSync(target, 'utf8') !== output) {
  writeFileSync(target, output);
  console.log(
    `registry.generated.ts : ${pluginFiles.length} plugins, ${domainFiles.length} fichiers de domaines`,
  );
}
