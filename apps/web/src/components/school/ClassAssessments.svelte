<script lang="ts">
  import { untrack } from 'svelte';
  import { registry } from '@app/content';
  import {
    dayKey,
    type ClassAssessmentDto,
    type ClassroomDetail,
    type EvaluationCode,
    type GradeId,
    type NewClassAssessment,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import NotionPicker from '../parent/NotionPicker.svelte';

  /**
   * Les évaluations sur papier : l'enseignant reporte A / ECA / NA par élève et par notion.
   * Les parents voient ce dernier avis à côté de l'acquisition mesurée dans l'app.
   */
  let { detail, onerror }: { detail: ClassroomDetail; onerror: (e: unknown) => void } = $props();

  const CYCLE: (EvaluationCode | null)[] = [null, 'A', 'ECA', 'NA'];

  let list = $state<ClassAssessmentDto[]>([]);
  /** Saisie en cours : null = fermée ; batch = correction d'une saisie existante. */
  let editing = $state<{ batch: string | null } | null>(null);
  let step = $state<'notions' | 'results'>('notions');
  let title = $state('');
  let assessedOn = $state(dayKey(new Date()));
  let grade = $state<GradeId>(untrack(() => detail.grades[0] ?? 'CP'));
  const chosen = new SvelteSet<string>();
  let results = $state<Record<number, Record<string, EvaluationCode>>>({});

  const notions = $derived(registry.notions.filter((n) => chosen.has(n.id)));
  const pupils = $derived(
    detail.grades.length > 1 ? detail.pupilList.filter((p) => p.grade === grade) : detail.pupilList,
  );

  async function load() {
    try {
      list = await api.get<ClassAssessmentDto[]>(`classes/${detail.id}/assessments`);
    } catch (e) {
      onerror(e);
    }
  }
  void load();

  function start(existing: ClassAssessmentDto | null) {
    editing = { batch: existing?.batch ?? null };
    title = existing?.title ?? '';
    assessedOn = existing?.assessedOn ?? dayKey(new Date());
    chosen.clear();
    for (const id of existing?.notions ?? []) chosen.add(id);
    results = existing ? $state.snapshot(existing.results) : {};
    step = existing ? 'results' : 'notions';
  }

  function cycle(pupilId: number, notionId: string) {
    const current = results[pupilId]?.[notionId] ?? null;
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]!;
    const row = { ...(results[pupilId] ?? {}) };
    if (next) row[notionId] = next;
    else delete row[notionId];
    results = { ...results, [pupilId]: row };
  }

  function fillColumn(notionId: string, code: EvaluationCode) {
    const next = { ...results };
    for (const p of pupils) next[p.id] = { ...(next[p.id] ?? {}), [notionId]: code };
    results = next;
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!editing) return;
    const ids = notions.map((n) => n.id);
    // Seuls les élèves et les notions de la saisie sont envoyés.
    const kept: NewClassAssessment['results'] = {};
    for (const p of pupils) {
      const row = Object.fromEntries(
        Object.entries(results[p.id] ?? {}).filter(([id]) => ids.includes(id)),
      );
      if (Object.keys(row).length) kept[p.id] = row;
    }
    const body: NewClassAssessment = {
      title:
        title.trim() ||
        `Évaluation du ${new Date(`${assessedOn}T12:00:00`).toLocaleDateString('fr-FR')}`,
      assessedOn,
      notions: ids,
      results: kept,
    };
    try {
      if (editing.batch) await api.put(`classes/${detail.id}/assessments/${editing.batch}`, body);
      else await api.post(`classes/${detail.id}/assessments`, body);
      editing = null;
      toast('Résultats enregistrés ✓ Les parents les voient dans leur bilan.');
      await load();
    } catch (e) {
      onerror(e);
    }
  }

  async function remove(a: ClassAssessmentDto) {
    if (!confirm(`Supprimer les résultats de « ${a.title} » ?`)) return;
    try {
      await api.del(`classes/${detail.id}/assessments/${a.batch}`);
      await load();
    } catch (e) {
      onerror(e);
    }
  }

  const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR');
  const count = (a: ClassAssessmentDto, code: EvaluationCode) =>
    Object.values(a.results).reduce(
      (n, row) => n + Object.values(row).filter((c) => c === code).length,
      0,
    );
</script>

{#if !editing}
  <p class="muted">
    Après une évaluation sur papier (le gabarit « Évaluation » de l’onglet Fiches), reporte ici les
    codes de chaque élève : les parents les voient à côté de l’acquisition mesurée dans l’app, et
    les notions ECA ou NA sont proposées à l’enfant pour s’entraîner.
  </p>
  {#if list.length > 0}
    <ul class="list">
      {#each list as a (a.batch)}
        <li>
          <div class="text">
            <strong>{a.title}</strong>
            <span class="muted"
              >{day(a.assessedOn)} · {a.notions
                .map((id) => registry.notion(id)?.title ?? id)
                .join(', ')}</span
            >
          </div>
          <span class="totals">
            <span class="c A">A {count(a, 'A')}</span>
            <span class="c ECA">ECA {count(a, 'ECA')}</span>
            <span class="c NA">NA {count(a, 'NA')}</span>
          </span>
          <button class="btn ghost small" onclick={() => start(a)}>Modifier</button>
          <button class="btn ghost small" onclick={() => remove(a)} aria-label="Supprimer"
            >🗑️</button
          >
        </li>
      {/each}
    </ul>
  {/if}
  <button class="btn small" disabled={detail.pupilList.length === 0} onclick={() => start(null)}
    >➕ Saisir une évaluation</button
  >
{:else}
  <form onsubmit={save}>
    <div class="row">
      <div class="field">
        <label for="as-title">Titre</label>
        <input
          id="as-title"
          bind:value={title}
          maxlength="80"
          placeholder="Évaluation des tables"
        />
      </div>
      <div class="field small">
        <label for="as-date">Date</label>
        <input id="as-date" type="date" bind:value={assessedOn} required />
      </div>
      {#if detail.grades.length > 1}
        <div class="field small">
          <label for="as-grade">Niveau</label>
          <select id="as-grade" bind:value={grade}>
            {#each detail.grades as g (g)}<option value={g}>{g}</option>{/each}
          </select>
        </div>
      {/if}
    </div>

    {#if step === 'notions'}
      <NotionPicker {grade} {chosen} legend="Notions évaluées" />
      <div class="row">
        <button class="btn ghost small" type="button" onclick={() => (editing = null)}
          >Annuler</button
        >
        <button
          class="btn small"
          type="button"
          disabled={chosen.size === 0 || chosen.size > 20}
          onclick={() => (step = 'results')}>Saisir les résultats</button
        >
      </div>
    {:else}
      <p class="muted">Touche une case pour passer de « — » à A, ECA puis NA.</p>
      <div class="grid-wrap">
        <table class="grid">
          <thead>
            <tr>
              <th>Élève</th>
              {#each notions as n (n.id)}
                <th title={n.competence}>
                  <span class="notion">{n.title}</span>
                  <button
                    type="button"
                    class="fill"
                    onclick={() => fillColumn(n.id, 'A')}
                    aria-label="Tous A pour {n.title}">tous A</button
                  >
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each pupils as p (p.id)}
              <tr>
                <td>{p.avatar} {p.firstName} {p.lastName ?? ''}</td>
                {#each notions as n (n.id)}
                  {@const code = results[p.id]?.[n.id] ?? null}
                  <td class="cell">
                    <button
                      type="button"
                      class="code {code ?? ''}"
                      aria-label="{p.firstName}, {n.title} : {code ?? 'pas évalué'}"
                      onclick={() => cycle(p.id, n.id)}>{code ?? '—'}</button
                    >
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="row">
        <button class="btn ghost small" type="button" onclick={() => (editing = null)}
          >Annuler</button
        >
        {#if !editing.batch}
          <button class="btn ghost small" type="button" onclick={() => (step = 'notions')}
            >⬅️ Notions</button
          >
        {/if}
        <button class="btn small" type="submit">Enregistrer</button>
      </div>
    {/if}
  </form>
{/if}

<style>
  .muted {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  .list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
  }
  .text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 200px;
  }
  .totals {
    display: flex;
    gap: 6px;
  }
  .c {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
  }
  .A {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .ECA {
    background: #bbdefb;
    color: #0d47a1;
  }
  .NA {
    background: #ffe0b2;
    color: #b45309;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    min-width: 140px;
  }
  .grid-wrap {
    overflow-x: auto;
  }
  .grid {
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .grid th,
  .grid td {
    padding: 4px 6px;
    border-bottom: 1px solid #eee;
    text-align: left;
  }
  .grid th {
    vertical-align: bottom;
    min-width: 90px;
    max-width: 160px;
  }
  .notion {
    display: block;
    font-size: 0.8rem;
  }
  .fill {
    border: none;
    background: none;
    color: var(--primary);
    font-size: 0.75rem;
    padding: 0;
    text-decoration: underline;
  }
  .cell {
    text-align: center;
  }
  .code {
    min-width: 54px;
    padding: 6px 8px;
    border-radius: 999px;
    border: 2px solid #e3d9ec;
    background: white;
    font-weight: 700;
    color: #b0aab8;
  }
  .code.A {
    background: #c8e6c9;
    color: #1b5e20;
    border-color: currentColor;
  }
  .code.ECA {
    background: #bbdefb;
    color: #0d47a1;
    border-color: currentColor;
  }
  .code.NA {
    background: #ffe0b2;
    color: #b45309;
    border-color: currentColor;
  }
</style>
