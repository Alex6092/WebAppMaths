<script lang="ts">
  import { registry } from '@app/content';
  import {
    addDays,
    dayKey,
    type AssignmentDto,
    type ChildDto,
    type NewAssignment,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';

  /** Les devoirs d'un enfant : en donner un (notions, nombre de questions, date) et les suivre. */
  let { child, onerror }: { child: ChildDto; onerror: (e: unknown) => void } = $props();

  const QUESTION_COUNTS = [5, 10, 15, 20];
  /** Le jour dans n jours, à l'heure de la famille (AAAA-MM-JJ). */
  const inDays = (n: number) => addDays(dayKey(new Date()), n);

  let list = $state<AssignmentDto[]>([]);
  let open = $state(false);
  let title = $state('');
  let questions = $state(10);
  let dueOn = $state(inDays(7));
  const chosen = new SvelteSet<string>();

  const groups = $derived(
    registry.domains
      .map((domain) => ({
        domain,
        notions: registry.notionsInScope(domain.id, child.grade),
      }))
      .filter((g) => g.notions.length > 0),
  );

  $effect(() => {
    const id = child.id;
    api.get<AssignmentDto[]>(`children/${id}/assignments`).then((rows) => {
      if (id === child.id) list = rows;
    }, onerror);
  });

  async function create(event: SubmitEvent) {
    event.preventDefault();
    const body: NewAssignment = {
      title:
        title.trim() ||
        `Devoirs pour le ${new Date(`${dueOn}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      notions: [...chosen],
      questions,
      dueOn,
    };
    try {
      const created = await api.post<AssignmentDto>(`children/${child.id}/assignments`, body);
      list = [created, ...list];
      open = false;
      title = '';
      chosen.clear();
      toast('Devoir donné ✓');
    } catch (e) {
      onerror(e);
    }
  }

  async function remove(a: AssignmentDto) {
    if (!confirm(`Supprimer le devoir « ${a.title} » ?`)) return;
    try {
      await api.del(`children/${child.id}/assignments/${a.id}`);
      list = list.filter((x) => x.id !== a.id);
    } catch (e) {
      onerror(e);
    }
  }

  const day = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  const notionNames = (ids: string[]) =>
    ids.map((id) => registry.notion(id)?.title ?? id).join(', ');
</script>

<div class="homework">
  {#if list.length === 0}
    <p class="muted">Aucun devoir pour l’instant.</p>
  {:else}
    <ul>
      {#each list as a (a.id)}
        <li>
          <div class="text">
            <strong>{a.title}</strong>
            <span class="muted">pour le {day(a.dueOn)} · {notionNames(a.notions)}</span>
          </div>
          <span class="state" class:done={a.completedAt !== null}>
            {a.completedAt !== null ? '✅ fait' : `${a.answered}/${a.questions}`}
          </span>
          <button class="btn ghost small" onclick={() => remove(a)} aria-label="Supprimer"
            >🗑️</button
          >
        </li>
      {/each}
    </ul>
  {/if}

  {#if !open}
    <button class="btn small" onclick={() => (open = true)}>➕ Donner un devoir</button>
  {:else}
    <form onsubmit={create}>
      <div class="row">
        <div class="field">
          <label for="hw-title">Titre (facultatif)</label>
          <input id="hw-title" bind:value={title} maxlength="80" placeholder="Leçon du jour" />
        </div>
        <div class="field small">
          <label for="hw-count">Questions</label>
          <select id="hw-count" bind:value={questions}>
            {#each QUESTION_COUNTS as n (n)}<option value={n}>{n}</option>{/each}
          </select>
        </div>
        <div class="field small">
          <label for="hw-due">Pour le</label>
          <input id="hw-due" type="date" min={inDays(0)} bind:value={dueOn} required />
        </div>
      </div>
      <fieldset>
        <legend>Notions à travailler</legend>
        {#each groups as { domain, notions } (domain.id)}
          <p class="domain">{domain.icon} {domain.title}</p>
          <div class="notions">
            {#each notions as notion (notion.id)}
              <label>
                <input
                  type="checkbox"
                  checked={chosen.has(notion.id)}
                  onchange={(e) =>
                    e.currentTarget.checked ? chosen.add(notion.id) : chosen.delete(notion.id)}
                />
                {notion.title}
              </label>
            {/each}
          </div>
        {/each}
      </fieldset>
      <div class="row">
        <button class="btn ghost small" type="button" onclick={() => (open = false)}>Annuler</button
        >
        <button class="btn small" type="submit" disabled={chosen.size === 0}
          >Donner le devoir</button
        >
      </div>
    </form>
  {/if}
</div>

<style>
  .homework {
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
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .text {
    flex: 1;
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
    min-width: 120px;
  }
  fieldset {
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 8px 12px 12px;
  }
  legend {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .domain {
    font-weight: 700;
    font-size: 0.9rem;
    margin-top: 6px;
  }
  .notions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 4px 12px;
    font-size: 0.9rem;
  }
  .notions label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .notions input {
    accent-color: var(--primary);
  }
</style>
