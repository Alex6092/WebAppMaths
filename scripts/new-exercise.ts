/**
 * Crée le squelette d'un nouveau type d'exercice :
 *   npm run new:exercise -- maths/geometrie/milieu-segment --widget mcq --notion maths.geometrie.milieu --title "Le milieu d'un segment"
 * Widgets disponibles : number-input (par défaut), mcq, column-op.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    widget: { type: 'string', default: 'number-input' },
    notion: { type: 'string' },
    title: { type: 'string' },
  },
});

const path = positionals[0]?.replace(/\\/g, '/').replace(/^\/|\/$/g, '');
if (!path || !/^[a-z0-9-]+(\/[a-z0-9-]+){2,}$/.test(path)) {
  console.error(
    'Usage : npm run new:exercise -- <matière>/<domaine>/<nom-de-l-exercice> [--widget mcq] [--notion id] [--title "…"]',
  );
  console.error(
    'Exemple : npm run new:exercise -- francais/conjugaison/infinitif-colorie --widget mcq',
  );
  process.exit(1);
}

const id = path.split('/').join('.');
const notion = values.notion ?? `${path.split('/').slice(0, 2).join('.')}.A-COMPLETER`;
const title = values.title ?? 'Titre à compléter';
const dir = join(root, 'packages', 'content', 'src', ...path.split('/'));
const file = join(dir, 'plugin.ts');
const depth = '../'.repeat(path.split('/').length);

const header = `import { defineLevels, definePlugin } from '@app/core';

// Paramètres d'un niveau (lus par generate).
interface Params {
  max: number;
}
`;

const common = `  version: 1,
  title: ${JSON.stringify(title)},
  description: 'À compléter : ce que l’enfant doit faire.',
  icon: '📝',
  notions: [${JSON.stringify(notion)}],
  levels: defineLevels<Params>([
    { label: 'Jusqu’à 10', grade: 'CE1', params: { max: 10 } },
    { label: 'Jusqu’à 100', grade: 'CE1', params: { max: 100 } },
  ]),`;

const templates: Record<string, string> = {
  'number-input': `${header}
export default definePlugin('number-input', {
  id: '${id}',
${common}

  // Toujours passer par rng (jamais Math.random) : la même graine redonne la même question.
  generate({ rng, params }) {
    const a = rng.int(1, params.max);
    const b = rng.int(1, params.max);
    return {
      widget: 'number-input',
      instruction: 'CALCULE.',
      prompt: \`\${a} + \${b} = {?}\`,
      data: { expected: a + b },
    };
  },

  solve: (q) => ({ value: String(q.data.expected) }),
});
`,
  mcq: `${header}
export default definePlugin('mcq', {
  id: '${id}',
${common}

  // Toujours passer par rng (jamais Math.random) : la même graine redonne la même question.
  generate({ rng, params }) {
    const n = rng.int(1, params.max);
    return {
      widget: 'mcq',
      instruction: 'COCHE la bonne réponse.',
      prompt: \`\${n} est-il pair ?\`,
      choices: [
        { id: 'oui', label: 'Oui' },
        { id: 'non', label: 'Non' },
      ],
      multiple: false,
      layout: 'row',
      data: { even: n % 2 === 0 },
    };
  },

  solve: (q) => ({ selected: [q.data.even ? 'oui' : 'non'] }),
});
`,
  'column-op': `import { columnSolution, defineLevels, definePlugin } from '@app/core';
import { randomWithDigits } from '${depth}lib/numbers';

interface Params {
  digits: number;
}

export default definePlugin('column-op', {
  id: '${id}',
  version: 1,
  title: ${JSON.stringify(title)},
  description: 'À compléter : ce que l’enfant doit faire.',
  icon: '📝',
  notions: [${JSON.stringify(notion)}],
  levels: defineLevels<Params>([
    { label: '2 chiffres', grade: 'CE1', params: { digits: 2 } },
    { label: '3 chiffres', grade: 'CE1', params: { digits: 3 } },
  ]),

  generate({ rng, params }) {
    return {
      widget: 'column-op',
      instruction: 'CALCULE.',
      op: '+',
      operands: [randomWithDigits(rng, params.digits), randomWithDigits(rng, params.digits)],
      showCarries: true,
      data: {},
    };
  },

  solve: columnSolution,
});
`,
};

const template = templates[values.widget!];
if (!template) {
  console.error(`Widget inconnu : ${values.widget}. Choix : ${Object.keys(templates).join(', ')}`);
  process.exit(1);
}
if (existsSync(file)) {
  console.error(`Existe déjà : ${file}`);
  process.exit(1);
}

mkdirSync(dir, { recursive: true });
writeFileSync(file, template);
execFileSync(
  process.execPath,
  [join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), join(root, 'scripts', 'gen-registry.ts')],
  {
    stdio: 'inherit',
  },
);

console.log(`
Créé : packages/content/src/${path}/plugin.ts (id « ${id} »)

Étapes suivantes :
  1. Déclarer la notion « ${notion} » dans packages/content/src/${path.split('/')[0]}/domains.ts (si elle n'existe pas).
  2. Écrire generate (avec rng) et solve, ajuster les niveaux.
  3. npm test : le test de contrat vérifie l'exercice sur 500 questions par niveau.
  4. npm run dev, puis #/dev/gallery pour le relire à l'écran.
`);
