<script lang="ts">
  import { onMount } from 'svelte';
  import { registry } from '@app/content';
  import { NEW_MASTERY, type ClassOverview, type ClassroomDetail } from '@app/core';
  import { api } from '../../lib/api';
  import { downloadFile } from '../../lib/download';
  import NotionBadge from '../NotionBadge.svelte';
  import TeacherCode from '../TeacherCode.svelte';
  import ChildReport from '../parent/ChildReport.svelte';

  /**
   * Le suivi de la classe : qui s'entraîne, qui a fait ses devoirs, où en est chacun sur la leçon
   * en cours. Un clic sur un élève ouvre son bilan (le même que celui de ses parents).
   */
  let { detail, onerror }: { detail: ClassroomDetail; onerror: (e: unknown) => void } = $props();

  let overview = $state<ClassOverview | null>(null);
  let followed = $state<number | null>(null);

  onMount(() => {
    api.get<ClassOverview>(`classes/${detail.id}/overview`).then((o) => (overview = o), onerror);
  });

  let exporting = $state(false);
  /** Le tableur de la classe : acquisition et avis de chaque élève, notion par notion. */
  async function exportCsv() {
    exporting = true;
    try {
      await downloadFile(`classes/${detail.id}/export.csv`, 'classe.csv');
    } catch (e) {
      onerror(e);
    } finally {
      exporting = false;
    }
  }

  const focus = $derived(detail.focusNotions.map((id) => registry.notion(id)).filter((n) => !!n));
  const pupilOf = (id: number) => detail.pupilList.find((p) => p.id === id);
  const since = (ms: number | null) => {
    if (ms === null) return 'jamais';
    const days = Math.floor((Date.now() - ms) / 86_400_000);
    return days === 0 ? 'aujourd’hui' : days === 1 ? 'hier' : `il y a ${days} j`;
  };
</script>

{#if !overview}
  <p class="muted">Chargement…</p>
{:else if overview.pupils.length === 0}
  <p class="muted">Pas encore d’élève dans cette classe.</p>
{:else}
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th>Élève</th>
          <th>Questions (7 j)</th>
          <th>Dernière fois</th>
          <th>Devoirs</th>
          <th>À revoir</th>
          <th title="Notions notées ECA ou NA par l’enseignant ces 6 dernières semaines"
            >🏫 À retravailler</th
          >
          {#each focus as n (n!.id)}<th class="notion" title={n!.competence}>📌 {n!.title}</th
            >{/each}
        </tr>
      </thead>
      <tbody>
        {#each overview.pupils as row (row.pupilId)}
          {@const p = pupilOf(row.pupilId)}
          <tr class:open={followed === row.pupilId}>
            <td>
              <button
                class="name"
                onclick={() => (followed = followed === row.pupilId ? null : row.pupilId)}
                >{p?.avatar} {p?.firstName} {p?.lastName ?? ''}</button
              >
            </td>
            <td class:quiet={row.questions7d === 0}>{row.questions7d}</td>
            <td>{since(row.lastActiveAt)}</td>
            <td>{row.homeworkTotal ? `${row.homeworkDone}/${row.homeworkTotal}` : '—'}</td>
            <td>{row.toReview || '—'}</td>
            <td class:rework={row.toRework > 0}>{row.toRework || '—'}</td>
            {#each focus as n (n!.id)}
              {@const avis = row.focusAssessments[n!.id]}
              <td>
                <span class="cell">
                  <NotionBadge mastery={row.focus[n!.id] ?? NEW_MASTERY} />
                  {#if avis}<TeacherCode assessment={avis} />{/if}
                </span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if focus.length === 0}
    <p class="muted">
      Choisis la leçon en cours (📌, onglet Notions) pour voir ici où en est chaque élève.
    </p>
  {/if}
{/if}

<div class="export">
  <button class="btn ghost small" disabled={exporting} onclick={exportCsv}
    >⬇️ Tableur de la classe (CSV)</button
  >
  <span class="muted"
    >Une ligne par élève et par notion : acquisition dans l’app et avis de l’enseignant, à ouvrir
    dans un tableur.</span
  >
</div>

{#if followed !== null}
  {@const p = pupilOf(followed)}
  <div class="report">
    <div class="report-head">
      <h3>{p?.avatar} Bilan de {p?.firstName}</h3>
      <button class="btn ghost small" onclick={() => (followed = null)}>Fermer</button>
    </div>
    <ChildReport childId={followed} source="ecole" {onerror} />
  </div>
{/if}

<style>
  .muted {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  .wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.92rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 6px;
    border-bottom: 1px solid #eee;
    white-space: nowrap;
  }
  th.notion {
    white-space: normal;
    min-width: 110px;
    font-size: 0.82rem;
  }
  tr.open td {
    background: #f7f4fb;
  }
  .name {
    border: none;
    background: none;
    padding: 0;
    color: var(--primary-dark);
    font-weight: 700;
    text-align: left;
  }
  .cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rework {
    color: #b45309;
    font-weight: 700;
  }
  .quiet {
    color: #c62828;
    font-weight: 700;
  }
  .export {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .report {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
  .report-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    color: var(--primary-dark);
  }
</style>
