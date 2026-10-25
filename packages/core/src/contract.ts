import { checkAnswer, generateQuestion, levelDef } from './engine';
import type { AnyPlugin } from './plugin';
import { createRng } from './rng';
import { getWidget, WIDGETS } from './widgets';

export interface ContractOptions {
  /** Notions connues du catalogue. */
  notionIds: ReadonlySet<string>;
  /** Identifiant attendu, déduit du chemin du dossier. */
  expectedId?: string;
  seedsPerLevel?: number;
}

const MAX_ERRORS = 20;

/**
 * Vérifie qu'un plugin respecte le contrat. Appliqué automatiquement à tous les plugins
 * du registre (packages/content/src/contract.test.ts) : un nouveau plugin est testé sans
 * rien écrire.
 */
export function checkPluginContract(plugin: AnyPlugin, options: ContractOptions): string[] {
  const errors: string[] = [];
  const fail = (message: string) => {
    if (errors.length < MAX_ERRORS) errors.push(`${plugin.id} : ${message}`);
  };

  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(plugin.id)) fail('identifiant invalide');
  if (options.expectedId && plugin.id !== options.expectedId) {
    fail(`l'identifiant doit être « ${options.expectedId} » (chemin du dossier)`);
  }
  if (!Number.isInteger(plugin.version) || plugin.version < 1) fail('version invalide');
  if (!(plugin.widget in WIDGETS)) fail(`widget inconnu ${plugin.widget}`);
  if (plugin.levels.length === 0) fail('aucun niveau');
  if (
    plugin.expectedLevel !== undefined &&
    (plugin.expectedLevel < 1 || plugin.expectedLevel > plugin.levels.length)
  ) {
    fail('expectedLevel hors des niveaux');
  }
  if (plugin.notions.length === 0) fail('aucune notion');
  for (const notion of plugin.notions) {
    if (!options.notionIds.has(notion)) fail(`notion inconnue ${notion}`);
  }
  if (errors.length) return errors;

  const seeds = options.seedsPerLevel ?? 500;
  const widget = getWidget(plugin.widget);

  for (let level = 1; level <= plugin.levels.length; level++) {
    const params = levelDef(plugin, level).params;
    const signatures = new Set<string>();
    for (let i = 1; i <= seeds && errors.length < MAX_ERRORS; i++) {
      const seed = Math.imul(i, 2654435761) >>> 0;
      const where = `niveau ${level}, graine ${seed}`;
      try {
        const q = generateQuestion(plugin, level, seed);
        if (q.widget !== plugin.widget)
          fail(`${where} : widget ${q.widget} au lieu de ${plugin.widget}`);
        const badValue = findNonJson(q);
        if (badValue) fail(`${where} : question non sérialisable (${badValue})`);
        const json = JSON.stringify(q);
        if (JSON.stringify(generateQuestion(plugin, level, seed)) !== json) {
          fail(`${where} : generate n'est pas déterministe`);
        }
        const solution = plugin.solve(q);
        if (!widget.validate(q as never, solution))
          fail(`${where} : solve renvoie une réponse mal formée`);
        else if (!widget.isComplete(q as never, solution as never))
          fail(`${where} : solve renvoie une réponse incomplète`);
        const result = checkAnswer(plugin, q, solution);
        if (!result.correct || result.score !== 1)
          fail(`${where} : check(solve(q)) n'est pas juste`);
        if (checkAnswer(plugin, q, widget.emptyAnswer(q as never)).correct) {
          fail(`${where} : une réponse vide est acceptée`);
        }
        const broken = plugin.invariants?.(q, { rng: createRng(seed), level, params });
        if (broken) fail(`${where} : ${broken}`);
        signatures.add(plugin.signature ? plugin.signature(q) : json);
      } catch (error) {
        fail(`${where} : ${(error as Error).message}`);
      }
    }
    const minVariety = Math.min(plugin.minVariety ?? 10, seeds);
    if (signatures.size < minVariety) {
      fail(`niveau ${level} : seulement ${signatures.size} questions différentes sur ${seeds}`);
    }
  }
  return errors;
}

/** Chemin de la première valeur non JSON (undefined, fonction, NaN…), ou null. */
function findNonJson(value: unknown, path = 'question'): string | null {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? null : path;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = findNonJson(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const found = findNonJson(child, `${path}.${key}`);
      if (found) return found;
    }
    return null;
  }
  return path;
}
