import type { Catalog, Domain, Notion, Subject } from './catalog';
import type { GradeId } from './grades';
import type { AnyPlugin } from './plugin';

/** Catalogue (matières, domaines, notions) et plugins, avec les liens entre eux. */
export class Registry {
  readonly subjects: Subject[];
  readonly domains: Domain[];
  readonly notions: Notion[];
  readonly plugins: AnyPlugin[];
  private readonly pluginById = new Map<string, AnyPlugin>();
  private readonly notionById = new Map<string, Notion>();
  private readonly domainById = new Map<string, Domain>();
  private readonly subjectById = new Map<string, Subject>();

  constructor(catalog: Catalog, plugins: AnyPlugin[]) {
    this.subjects = [...catalog.subjects].sort((a, b) => a.order - b.order);
    this.domains = [...catalog.domains].sort((a, b) => a.order - b.order);
    this.notions = [...catalog.notions];
    this.plugins = [...plugins];
    for (const s of this.subjects) addUnique(this.subjectById, s.id, s, 'matière');
    for (const d of this.domains) addUnique(this.domainById, d.id, d, 'domaine');
    for (const n of this.notions) addUnique(this.notionById, n.id, n, 'notion');
    for (const p of this.plugins) addUnique(this.pluginById, p.id, p, 'plugin');
  }

  plugin(id: string): AnyPlugin | undefined {
    return this.pluginById.get(id);
  }
  notion(id: string): Notion | undefined {
    return this.notionById.get(id);
  }
  domain(id: string): Domain | undefined {
    return this.domainById.get(id);
  }
  subject(id: string): Subject | undefined {
    return this.subjectById.get(id);
  }

  domainsOf(subjectId: string): Domain[] {
    return this.domains.filter((d) => d.subject === subjectId);
  }
  notionsOf(domainId: string): Notion[] {
    return this.notions.filter((n) => n.domain === domainId);
  }
  pluginsOfNotion(notionId: string): AnyPlugin[] {
    return this.plugins.filter((p) => p.notions.includes(notionId));
  }
  pluginsOfDomain(domainId: string): AnyPlugin[] {
    const notions = new Set(this.notionsOf(domainId).map((n) => n.id));
    return this.plugins.filter((p) => p.notions.some((n) => notions.has(n)));
  }
  pluginsOfSubject(subjectId: string): AnyPlugin[] {
    const domains = new Set(this.domainsOf(subjectId).map((d) => d.id));
    return this.plugins.filter((p) =>
      p.notions.some((n) => domains.has(this.notionById.get(n)?.domain ?? '')),
    );
  }
  /**
   * Les notions d'un mélange : « all », une matière, un domaine ou une notion, limitées à
   * celles qui ont des exercices (et, si une classe est donnée, travaillées dans cette classe).
   */
  notionsInScope(scope: string, grade?: GradeId): Notion[] {
    return this.notions.filter((n) => {
      const domain = this.domainById.get(n.domain);
      const inScope =
        scope === 'all' || n.id === scope || n.domain === scope || domain?.subject === scope;
      return (
        inScope &&
        (!grade || n.grades.includes(grade)) &&
        this.plugins.some((p) => p.notions.includes(n.id))
      );
    });
  }

  /** Les exercices qui entraînent au moins une de ces notions. */
  pluginsOfNotions(notionIds: readonly string[]): AnyPlugin[] {
    return this.plugins.filter((p) => p.notions.some((n) => notionIds.includes(n)));
  }

  /** Matière d'un plugin (celle de sa première notion). */
  subjectOf(plugin: AnyPlugin): Subject | undefined {
    const notion = this.notionById.get(plugin.notions[0] ?? '');
    const domain = notion && this.domainById.get(notion.domain);
    return domain && this.subjectById.get(domain.subject);
  }

  /** Références cassées entre catalogue et plugins. */
  validate(): string[] {
    const errors: string[] = [];
    for (const d of this.domains) {
      if (!this.subjectById.has(d.subject))
        errors.push(`domaine ${d.id} : matière inconnue ${d.subject}`);
    }
    for (const n of this.notions) {
      if (!this.domainById.has(n.domain))
        errors.push(`notion ${n.id} : domaine inconnu ${n.domain}`);
    }
    for (const p of this.plugins) {
      for (const n of p.notions) {
        if (!this.notionById.has(n)) errors.push(`plugin ${p.id} : notion inconnue ${n}`);
      }
    }
    return errors;
  }
}

function addUnique<T>(map: Map<string, T>, id: string, value: T, kind: string): void {
  if (map.has(id)) throw new Error(`Identifiant de ${kind} en double : ${id}`);
  map.set(id, value);
}
