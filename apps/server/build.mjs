// Construit dist/index.js (serveur) et dist/cli.js (sauvegardes, invitations).
// Le code de l'app et les paquets @app/* sont regroupés ; les dépendances npm restent externes.
import { build } from 'esbuild';
import { cpSync, readFileSync, rmSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies).filter((name) => !name.startsWith('@app/'));

rmSync('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/index.ts', 'src/cli.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external,
  sourcemap: true,
  logLevel: 'info',
});
cpSync('drizzle', 'dist/drizzle', { recursive: true });
