<script lang="ts">
  import { registry } from '@app/content';
  import {
    DEFAULT_EVALUATION_SIZE,
    EVALUATION_SIZES,
    type ChildDto,
    type EvaluationDto,
    type EvaluationReport,
    type NewEvaluation,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import EvaluationSheet from './EvaluationSheet.svelte';
  import NotionPicker from './NotionPicker.svelte';

  /**
   * Les évaluations blanches d'un enfant : en préparer une (notions, questions par notion),
   * suivre où il en est et ouvrir le bilan imprimable.
   */
  let { child, onerror }: { child: ChildDto; onerror: (e: unknown) => void } = $props();

  /** Au-delà, l'évaluation devient trop longue pour un enfant de primaire. */
  const MAX_NOTIONS = 12;

  let list = $state<EvaluationDto[]>([]);
  let open = $state(false);
  let title = $state('');
  let perNotion = $state(DEFAULT_EVALUATION_SIZE);
  const chosen = new SvelteSet<string>();
  let report = $state<EvaluationReport | null>(null);

  $effect(() => {
    const id = child.id;
    api.get<EvaluationDto[]>(`children/${id}/evaluations`).then((rows) => {
      if (id === child.id) list = rows;
    }, onerror);
  });

  async function create(event: SubmitEvent) {
    event.preventDefault();
    const body: NewEvaluation = {
      title:
        title.trim() ||
        `Évaluation du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      notions: [...chosen],
      perNotion,
    };
    try {
      const created = await api.post<EvaluationDto>(`children/${child.id}/evaluations`, body);
      list = [created, ...list];
      open = false;
      title = '';
      chosen.clear();
      toast('Évaluation prête ✓');
    } catch (e) {
      onerror(e);
    }
  }

  async function show(e: EvaluationDto) {
    try {
      report = await api.get<EvaluationReport>(`children/${child.id}/evaluations/${e.id}`);
    } catch (err) {
      onerror(err);
    }
  }

  async function remove(e: EvaluationDto) {
    if (!confirm(`Supprimer l’évaluation « ${e.title} » et ses résultats ?`)) return;
    try {
      await api.del(`children/${child.id}/evaluations/${e.id}`);
      list = list.filter((x) => x.id !== e.id);
    } catch (err) {
      onerror(err);
    }
  }

  const day = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const notionCount = (ids: string[]) =>
    ids.length === 1 ? (registry.notion(ids[0]!)?.title ?? '1 notion') : `${ids.length} notions`;
</script>

<div class="evaluations">
  {#if list.length === 0}
    <p class="muted">Aucune évaluation pour l’instant.</p>
  {:else}
    <ul>
      {#each list as e (e.id)}
        <li>
          <div class="text">
            <strong>{e.title}</strong>
            <span class="muted"
              >préparée le {day(e.createdAt)} · {notionCount(e.notions)} · {e.perNotion} questions par
              notion</span
            >
          </div>
          <span class="state" class:done={e.completedAt !== null}>
            {e.completedAt !== null
              ? '✅ faite'
              : e.answered > 0
                ? `${e.answered}/${e.total}`
                : 'à faire'}
          </span>
          <button class="btn small" disabled={e.answered === 0} onclick={() => show(e)}
            >📄 Bilan</button
          >
          <button class="btn ghost small" onclick={() => remove(e)} aria-label="Supprimer"
            >🗑️</button
          >
        </li>
      {/each}
    </ul>
  {/if}

  {#if !open}
    <button class="btn small" onclick={() => (open = true)}>➕ Préparer une évaluation</button>
  {:else}
    <form onsubmit={create}>
      <p class="muted">
        {child.firstName} répondra une seule fois à chaque question, sans correction ni pièces, au niveau
        attendu en fin d’année. Le bilan donne, pour chaque notion, le barème et le code de l’école (A,
        ECA, NA).
      </p>
      <div class="row">
        <div class="field">
          <label for="ev-title">Titre (facultatif)</label>
          <input
            id="ev-title"
            bind:value={title}
            maxlength="80"
            placeholder="Évaluation de période"
          />
        </div>
        <div class="field small">
          <label for="ev-count">Questions par notion</label>
          <select id="ev-count" bind:value={perNotion}>
            {#each EVALUATION_SIZES as n (n)}<option value={n}>{n}</option>{/each}
          </select>
        </div>
      </div>
      <NotionPicker grade={child.grade} {chosen} legend="Notions évaluées" />
      <div class="row">
        <button class="btn ghost small" type="button" onclick={() => (open = false)}>Annuler</button
        >
        <button
          class="btn small"
          type="submit"
          disabled={chosen.size === 0 || chosen.size > MAX_NOTIONS}
          >Préparer ({chosen.size * perNotion} questions)</button
        >
      </div>
      {#if chosen.size > MAX_NOTIONS}
        <p class="muted">{MAX_NOTIONS} notions au plus par évaluation.</p>
      {/if}
    </form>
  {/if}
</div>

{#if report}
  <EvaluationSheet {report} onclose={() => (report = null)} />
{/if}

<style>
  .evaluations {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  ul {
    list-style: none;
    padding: 0;
    width: 100%;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .text {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    font-size: 0.92rem;
  }
  .state {
    font-weight: 700;
    color: var(--primary-dark);
    white-space: nowrap;
  }
  .state.done {
    color: #2e7d32;
  }
  .muted {
    color: var(--text-soft);
    font-size: 0.88rem;
  }
  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }
  .field {
    flex: 1;
    min-width: 160px;
  }
  .field.small {
    flex: 0 0 auto;
    min-width: 160px;
  }
</style>
