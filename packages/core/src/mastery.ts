/**
 * Acquisition par notion, calculée à partir des tentatives : même calcul côté serveur
 * (source de vérité) et côté interface. Les codes sont ceux des évaluations de l'école.
 */
import type { AnyPlugin } from './plugin';
import type { Rng } from './rng';

/** new : jamais travaillée ; NA : non acquis ; ECA : en cours d'acquisition ; A : acquis. */
export type NotionStatus = 'new' | 'NA' | 'ECA' | 'A';

export interface AttemptRecord {
  pluginId: string;
  level: number;
  firstTryCorrect: boolean;
  solved: boolean;
}

export interface NotionMastery {
  /** De 0 à 100. */
  mastery: number;
  status: NotionStatus;
  attempts: number;
}

export const MASTERY_RULES = {
  /** Tentatives récentes prises en compte dans le score. */
  window: 20,
  /** Poids d'une tentative par rapport à la suivante (les plus récentes comptent plus). */
  decay: 0.85,
  /** Acquis : au moins 8 des 10 dernières tentatives au niveau attendu, justes du premier coup. */
  acquiredWindow: 10,
  acquiredMin: 8,
  acquiredRate: 0.8,
  /** En dessous de ce score : non acquis. */
  inProgressFrom: 35,
};

export const NEW_MASTERY: NotionMastery = { mastery: 0, status: 'new', attempts: 0 };

/** Juste du premier coup : 1 ; au deuxième essai : la moitié ; sinon 0. */
const scoreOf = (r: AttemptRecord) => (r.firstTryCorrect ? 1 : r.solved ? 0.5 : 0);

/** Niveau à atteindre en fin d'année pour un plugin (le dernier par défaut). */
export const expectedLevelOf = (plugin: AnyPlugin): number =>
  plugin.expectedLevel ?? plugin.levels.length;

/**
 * Maîtrise d'une notion à partir de ses tentatives (de la plus ancienne à la plus récente).
 * Une réussite à un niveau facile compte moins qu'au niveau attendu.
 */
export function notionMastery(
  records: readonly AttemptRecord[],
  expectedLevel: (pluginId: string) => number,
): NotionMastery {
  if (records.length === 0) return NEW_MASTERY;
  const rules = MASTERY_RULES;
  const recent = records.slice(-rules.window);
  let total = 0;
  let weights = 0;
  recent.forEach((r, i) => {
    const weight = rules.decay ** (recent.length - 1 - i);
    const difficulty = Math.min(1, r.level / expectedLevel(r.pluginId));
    total += weight * scoreOf(r) * difficulty;
    weights += weight;
  });
  const mastery = Math.round((100 * total) / weights);

  const atLevel = records
    .filter((r) => r.level >= expectedLevel(r.pluginId))
    .slice(-rules.acquiredWindow);
  const acquired =
    atLevel.length >= rules.acquiredMin &&
    atLevel.filter((r) => r.firstTryCorrect).length / atLevel.length >= rules.acquiredRate;

  return {
    mastery,
    status: acquired ? 'A' : mastery >= rules.inProgressFrom ? 'ECA' : 'NA',
    attempts: records.length,
  };
}

/** Maîtrise de chaque notion demandée, à partir de toutes les tentatives d'un enfant. */
export function masteryByNotion(
  records: readonly AttemptRecord[],
  plugins: readonly AnyPlugin[],
  notionIds: readonly string[],
): Record<string, NotionMastery> {
  const byId = new Map(plugins.map((p) => [p.id, p]));
  const expected = (id: string) => {
    const plugin = byId.get(id);
    return plugin ? expectedLevelOf(plugin) : 1;
  };
  const out: Record<string, NotionMastery> = {};
  for (const notion of notionIds) {
    const trained = new Set(plugins.filter((p) => p.notions.includes(notion)).map((p) => p.id));
    out[notion] = notionMastery(
      records.filter((r) => trained.has(r.pluginId)),
      expected,
    );
  }
  return out;
}

/**
 * Exercice suivant d'un mélange : plus souvent ceux des notions les moins maîtrisées,
 * jamais deux fois de suite le même (quand il y a le choix).
 */
export function pickMixPlugin(
  rng: Rng,
  plugins: readonly AnyPlugin[],
  notionIds: readonly string[],
  masteries: Record<string, NotionMastery | undefined>,
  previous?: string,
  /** Notions à réviser aujourd'hui (révision espacée) : elles reviennent plus souvent. */
  due: ReadonlySet<string> = new Set(),
): AnyPlugin {
  if (plugins.length === 0) throw new Error('pickMixPlugin : aucun exercice');
  const candidates = plugins.length > 1 ? plugins.filter((p) => p.id !== previous) : plugins;
  const weights = candidates.map((p) => {
    const notions = p.notions.filter((n) => notionIds.includes(n));
    const levels = notions.map((n) => masteries[n]?.mastery ?? 0);
    const mastery = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    // Une notion acquise revient encore de temps en temps (poids 0,25 contre 1,25) ;
    // à réviser, elle compte autant qu'une notion à travailler.
    const weight = 1.25 - mastery / 100;
    return notions.some((n) => due.has(n)) ? Math.max(weight, 1.25) : weight;
  });
  let r = rng.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]!;
    if (r < 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}
