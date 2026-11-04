<script lang="ts">
  import { registry } from '@app/content';
  import { NEW_MASTERY, type ChildReport, type MistakeDto, type NotionStatus } from '@app/core';
  import { api } from '../../lib/api';
  import { STATUS_LABELS } from '../../lib/notions';
  import { session } from '../../lib/session.svelte';
  import NotionBadge from '../NotionBadge.svelte';
  import TeacherCode from '../TeacherCode.svelte';
  import ActivityChart from './ActivityChart.svelte';
  import MistakeViewer from './MistakeViewer.svelte';
  import ResponseTimes from './ResponseTimes.svelte';

  /**
   * Le bilan d'un enfant : activité, acquisition des notions (mesurée dans l'app, et l'avis de
   * l'enseignant pour un élève inscrit), erreurs fréquentes, séances. Le même bilan sert au parent
   * (source « famille ») et à l'enseignant (source « ecole »).
   */
  let {
    childId,
    onerror,
    source = 'famille',
  }: { childId: number; onerror: (e: unknown) => void; source?: 'famille' | 'ecole' } = $props();

  let report = $state<ChildReport | null>(null);
  let viewing = $state<MistakeDto | null>(null);

  /** Coche ou décoche une notion vue en classe. */
  async function toggleSeen(notionId: string, active: boolean) {
    if (!report) return;
    try {
      const res = await api.patch<{ activeNotions: string[] }>(
        `children/${report.child.id}/notions`,
        { notionId, active },
      );
      report.activeNotions = res.activeNotions;
      // Sur l'appareil de l'enfant, ses mélanges en tiennent compte tout de suite.
      if (session.childState?.child.id === report.child.id)
        session.childState.activeNotions = res.activeNotions;
    } catch (e) {
      onerror(e);
    }
  }

  $effect(() => {
    const id = childId;
    report = null;
    const url = source === 'ecole' ? `pupils/${id}/report` : `children/${id}/report`;
    api.get<ChildReport>(url).then((r) => {
      if (id === childId) report = r;
    }, onerror);
  });

  const totals = $derived.by(() => {
    const days = report?.days ?? [];
    const questions = days.reduce((n, d) => n + d.questions, 0);
    const firstTry = days.reduce((n, d) => n + d.firstTry, 0);
    return {
      questions,
      rate: questions ? Math.round((firstTry / questions) * 100) : null,
      minutes: days.reduce((n, d) => n + d.minutes, 0),
      activeDays: days.filter((d) => d.questions > 0).length,
    };
  });

  /** Les notions de la classe de l'enfant, par matière puis par domaine. */
  /** « Seulement les notions vues en classe » : cochée d'office pour un élève inscrit. */
  let onlySeenChoice = $state<boolean | null>(null);
  const onlySeen = $derived(onlySeenChoice ?? report?.notionsSetBy === 'ecole');

  const subjects = $derived.by(() => {
    if (!report) return [];
    const grade = report.child.grade;
    const seen = new Set(report.activeNotions);
    return registry.subjects
      .map((subject) => ({
        subject,
        domains: registry
          .domainsOf(subject.id)
          .map((domain) => ({
            domain,
            notions: registry
              .notionsInScope(domain.id, grade)
              .filter((n) => !onlySeen || seen.has(n.id)),
          }))
          .filter((d) => d.notions.length > 0),
      }))
      .filter((s) => s.domains.length > 0);
  });

  const masteryOf = (id: string) => report?.notions[id] ?? NEW_MASTERY;
  /** Les cases « vue en classe » : le parent les règle, sauf pour un élève inscrit. */
  const canToggle = $derived(source === 'famille' && report?.notionsSetBy === 'famille');
  const enrolled = $derived(report?.notionsSetBy === 'ecole');
  const hasAssessments = $derived(Object.keys(report?.assessments ?? {}).length > 0);
  const focusNotions = $derived(
    (report?.focusNotions ?? []).map((id) => registry.notion(id)).filter((n) => !!n),
  );
  const STATUS_ORDER: NotionStatus[] = ['A', 'ECA', 'NA', 'new'];
  function countByStatus(ids: string[]) {
    return STATUS_ORDER.map((status) => ({
      status,
      n: ids.filter((id) => masteryOf(id).status === status).length,
    })).filter((c) => c.n > 0);
  }

  const duration = (minutes: number) =>
    minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;

  function sessionLabel(s: ChildReport['sessions'][number]): string {
    if (s.mode === 'daily') return '🎯 Défi du jour';
    if (s.mode === 'review') return '🔁 Revoir mes erreurs';
    if (s.mode === 'homework') return '📝 Devoir';
    if (s.mode === 'evaluation') return '📋 Évaluation blanche';
    if (s.mode === 'mix') return `🎲 Mélange (${s.notions} notion${s.notions > 1 ? 's' : ''})`;
    const plugin = s.pluginId ? registry.plugin(s.pluginId) : undefined;
    return plugin ? `${plugin.icon ?? '📝'} ${plugin.title}` : 'Exercice';
  }
  const when = (ms: number) =>
    new Date(ms).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
</script>

{#if !report}
  <p class="muted">Chargement du bilan…</p>
{:else}
  <div class="tiles">
    <div class="tile"><strong>{totals.questions}</strong>questions en 30 jours</div>
    <div class="tile">
      <strong>{totals.rate === null ? '—' : `${totals.rate} %`}</strong>justes du premier coup
    </div>
    <div class="tile"><strong>{duration(totals.minutes)}</strong>de travail</div>
    <div class="tile"><strong>{totals.activeDays}</strong>jours actifs</div>
    <div class="tile">
      <strong>🔥 {report.daily.streak.current}</strong>jours de suite (record {report.daily.streak
        .best})
    </div>
    <div class="tile"><strong>🔁 {report.toReview}</strong>questions à revoir</div>
  </div>

  <h3>Activité</h3>
  <ActivityChart days={report.days} />

  <h3>⏱️ Temps de réponse</h3>
  <ResponseTimes timing={report.timing} />

  {#snippet teacher(id: string)}
    {@const a = report?.assessments[id]}
    {#if a}<TeacherCode assessment={a} />{:else}<span></span>{/if}
  {/snippet}

  <h3>Acquisition des notions ({report.child.grade})</h3>
  {#if enrolled}
    <p class="muted hint">
      La jauge mesure le travail fait dans l’app, à l’école comme à la maison ; 🏫 est l’avis de
      l’enseignant après une évaluation sur papier. ☑️ = vue en classe (réglé par l’enseignant).
    </p>
  {:else}
    <p class="muted hint">
      ☑️ = vue en classe : « Tout mélanger » et le défi du jour ne prennent que ces notions.
    </p>
  {/if}
  {#if focusNotions.length > 0}
    <div class="focus">
      <h4>📌 En ce moment en classe</h4>
      <ul class="notions" class:with-teacher={hasAssessments}>
        {#each focusNotions as notion (notion!.id)}
          {@const m = masteryOf(notion!.id)}
          <li>
            <span>📌</span>
            <span class="notion-title" title={notion!.competence}>{notion!.title}</span>
            <span class="meter" title="{m.mastery} / 100"
              ><span style:width="{m.mastery}%"></span></span
            >
            <span class="attempts">{m.attempts} q.</span>
            {#if hasAssessments}{@render teacher(notion!.id)}{/if}
            <NotionBadge mastery={m} review={report.reviews[notion!.id]} />
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <label class="only-seen">
    <input
      type="checkbox"
      checked={onlySeen}
      onchange={(e) => (onlySeenChoice = e.currentTarget.checked)}
    />
    Seulement les notions vues en classe ({report.activeNotions.length})
  </label>
  {#each subjects as { subject, domains } (subject.id)}
    {@const ids = domains.flatMap((d) => d.notions.map((n) => n.id))}
    <div class="subject">
      <h4 style:color={subject.color}>
        {subject.icon}
        {subject.title}
        <span class="counts">
          {#each countByStatus(ids) as c (c.status)}<span
              >{c.n} {STATUS_LABELS[c.status].toLowerCase()}</span
            >{/each}
        </span>
      </h4>
      {#each domains as { domain, notions } (domain.id)}
        <p class="domain">{domain.icon} {domain.title}</p>
        <ul class="notions" class:with-teacher={hasAssessments}>
          {#each notions as notion (notion.id)}
            {@const m = masteryOf(notion.id)}
            {@const seen = report.activeNotions.includes(notion.id)}
            <li class:unseen={enrolled && !seen}>
              <input
                type="checkbox"
                checked={seen}
                disabled={!canToggle}
                onchange={(e) => toggleSeen(notion.id, e.currentTarget.checked)}
                aria-label="{notion.title} : vue en classe"
                title={canToggle ? 'Vue en classe' : 'Vue en classe (réglé par l’enseignant)'}
              />
              <span class="notion-title" title={notion.competence}>{notion.title}</span>
              <span class="meter" title="{m.mastery} / 100"
                ><span style:width="{m.mastery}%"></span></span
              >
              <span class="attempts">{m.attempts} q.</span>
              {#if hasAssessments}{@render teacher(notion.id)}{/if}
              <NotionBadge mastery={m} review={report.reviews[notion.id]} />
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  {/each}

  <h3>Erreurs fréquentes</h3>
  {#if report.mistakes.length === 0}
    <p class="muted">Aucune erreur ces 30 derniers jours. 👏</p>
  {:else}
    <ul class="mistakes">
      {#each report.mistakes as m (m.pluginId)}
        {@const plugin = registry.plugin(m.pluginId)}
        <li>
          <span class="mistake-title">{plugin?.icon} {plugin?.title}</span>
          <span class="muted"
            >{m.errors} erreur{m.errors > 1 ? 's' : ''} sur {m.attempts} question{m.attempts > 1
              ? 's'
              : ''}</span
          >
          <span class="examples">
            {#each m.recent as mistake, i (i)}
              <button class="btn ghost small" onclick={() => (viewing = mistake)}
                >Voir la question{m.recent.length > 1 ? ` ${i + 1}` : ''}</button
              >
            {/each}
          </span>
        </li>
      {/each}
    </ul>
  {/if}

  <h3>Dernières séances</h3>
  {#if report.sessions.length === 0}
    <p class="muted">Pas encore de séance.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Quand</th><th>Quoi</th><th>Questions</th><th>Du 1er coup</th></tr>
      </thead>
      <tbody>
        {#each report.sessions as s (s.id)}
          <tr>
            <td>{when(s.startedAt)}</td>
            <td>{sessionLabel(s)}</td>
            <td>{s.nQuestions}</td>
            <td>{Math.round((s.nFirstTry / s.nQuestions) * 100)} %</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}

{#if viewing}
  <MistakeViewer mistake={viewing} onclose={() => (viewing = null)} />
{/if}

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f7f4fb;
    color: var(--text-soft);
    font-size: 0.88rem;
  }
  .tile strong {
    font-size: 1.35rem;
    color: var(--primary-dark);
  }
  h3 {
    color: var(--primary-dark);
    font-size: 1.1rem;
    margin-top: 8px;
  }
  h4 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 10px;
    font-size: 1.05rem;
  }
  .counts {
    display: flex;
    gap: 10px;
    color: var(--text-soft);
    font-size: 0.85rem;
    font-weight: 400;
  }
  .subject {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .domain {
    font-weight: 700;
    font-size: 0.95rem;
    margin-top: 4px;
  }
  .notions,
  .mistakes {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .notions li {
    display: grid;
    grid-template-columns: 22px 1fr 90px 44px 104px;
    align-items: center;
    gap: 10px;
    font-size: 0.92rem;
  }
  .notions.with-teacher li {
    grid-template-columns: 22px 1fr 90px 44px 64px 104px;
  }
  .notions li.unseen .notion-title {
    color: var(--text-soft);
  }
  .notions input {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }
  .only-seen {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .only-seen input {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }
  .focus {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f7f4fb;
  }
  .hint {
    font-size: 0.85rem;
  }
  .meter {
    height: 8px;
    border-radius: 4px;
    background: #ece7f2;
    overflow: hidden;
  }
  .meter span {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--primary);
  }
  .notions li > :global(:last-child) {
    justify-self: end;
  }
  .attempts {
    color: var(--text-soft);
    font-size: 0.8rem;
    text-align: right;
  }
  .mistakes li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .mistake-title {
    font-weight: 700;
  }
  .examples {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: auto;
  }
  .muted {
    color: var(--text-soft);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 4px;
    border-bottom: 1px solid #eee;
  }
  @media (max-width: 520px) {
    .notions li,
    .notions.with-teacher li {
      grid-template-columns: 22px 1fr auto auto;
    }
    .meter,
    .attempts {
      display: none;
    }
  }
</style>
