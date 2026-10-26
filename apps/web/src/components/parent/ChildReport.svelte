<script lang="ts">
  import { registry } from '@app/content';
  import { NEW_MASTERY, type ChildReport, type MistakeDto, type NotionStatus } from '@app/core';
  import { api } from '../../lib/api';
  import { STATUS_LABELS } from '../../lib/notions';
  import NotionBadge from '../NotionBadge.svelte';
  import ActivityChart from './ActivityChart.svelte';
  import MistakeViewer from './MistakeViewer.svelte';

  /** Le bilan d'un enfant : activité, acquisition des notions, erreurs fréquentes, séances. */
  let { childId, onerror }: { childId: number; onerror: (e: unknown) => void } = $props();

  let report = $state<ChildReport | null>(null);
  let viewing = $state<MistakeDto | null>(null);

  $effect(() => {
    const id = childId;
    report = null;
    api.get<ChildReport>(`children/${id}/report`).then((r) => {
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
  const subjects = $derived.by(() => {
    if (!report) return [];
    const grade = report.child.grade;
    return registry.subjects
      .map((subject) => ({
        subject,
        domains: registry
          .domainsOf(subject.id)
          .map((domain) => ({ domain, notions: registry.notionsInScope(domain.id, grade) }))
          .filter((d) => d.notions.length > 0),
      }))
      .filter((s) => s.domains.length > 0);
  });

  const masteryOf = (id: string) => report?.notions[id] ?? NEW_MASTERY;
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

  <h3>Acquisition des notions ({report.child.grade})</h3>
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
        <ul class="notions">
          {#each notions as notion (notion.id)}
            {@const m = masteryOf(notion.id)}
            <li>
              <span class="notion-title" title={notion.competence}>{notion.title}</span>
              <span class="meter" title="{m.mastery} / 100"
                ><span style:width="{m.mastery}%"></span></span
              >
              <span class="attempts">{m.attempts} q.</span>
              <NotionBadge mastery={m} />
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
    grid-template-columns: 1fr 90px 44px 104px;
    align-items: center;
    gap: 10px;
    font-size: 0.92rem;
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
    .notions li {
      grid-template-columns: 1fr auto;
    }
    .meter,
    .attempts {
      display: none;
    }
  }
</style>
