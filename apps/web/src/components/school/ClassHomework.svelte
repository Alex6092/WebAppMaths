<script lang="ts">
  import { untrack } from 'svelte';
  import { registry } from '@app/content';
  import {
    addDays,
    dayKey,
    type ClassAssignmentDto,
    type ClassroomDetail,
    type GradeId,
    type NewClassAssignment,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import NotionPicker from '../parent/NotionPicker.svelte';

  /** Les devoirs de la classe, à faire à la maison : pour toute la classe ou quelques élèves. */
  let { detail, onerror }: { detail: ClassroomDetail; onerror: (e: unknown) => void } = $props();

  const QUESTION_COUNTS = [5, 10, 15, 20];
  const inDays = (n: number) => addDays(dayKey(new Date()), n);

  let list = $state<ClassAssignmentDto[]>([]);
  let open = $state(false);
  let title = $state('');
  let questions = $state(10);
  let dueOn = $state(inDays(7));
  let grade = $state<GradeId>(untrack(() => detail.grades[0] ?? 'CP'));
  let everyone = $state(true);
  const chosen = new SvelteSet<string>();
  const pupils = new SvelteSet<number>();

  async function load() {
    try {
      list = await api.get<ClassAssignmentDto[]>(`classes/${detail.id}/assignments`);
    } catch (e) {
      onerror(e);
    }
  }
  void load();

  async function create(event: SubmitEvent) {
    event.preventDefault();
    const body: NewClassAssignment = {
      title:
        title.trim() ||
        `Devoirs pour le ${new Date(`${dueOn}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      notions: [...chosen],
      questions,
      dueOn,
      ...(everyone ? {} : { pupilIds: [...pupils] }),
    };
    try {
      const created = await api.post<ClassAssignmentDto>(`classes/${detail.id}/assignments`, body);
      list = [created, ...list];
      open = false;
      title = '';
      chosen.clear();
      pupils.clear();
      everyone = true;
      toast('Devoir donné ✓');
    } catch (e) {
      onerror(e);
    }
  }

  async function remove(a: ClassAssignmentDto) {
    if (!confirm(`Supprimer le devoir « ${a.title} » pour tous les élèves ?`)) return;
    try {
      await api.del(`classes/${detail.id}/assignments/${a.batch}`);
      list = list.filter((x) => x.batch !== a.batch);
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
  const pupilName = (id: number) => detail.pupilList.find((p) => p.id === id)?.firstName ?? '?';
</script>

<p class="muted">
  Des exercices à faire à la maison, pour ceux qui ont besoin de s’entraîner. Les parents voient le
  devoir dans leur espace ; il ne remplace pas les fiches sur papier.
</p>

{#if list.length === 0}
  <p class="muted">Aucun devoir pour l’instant.</p>
{:else}
  <ul class="list">
    {#each list as a (a.batch)}
      {@const done = a.pupils.filter((p) => p.completedAt !== null).length}
      <li>
        <div class="line">
          <div class="text">
            <strong>{a.title}</strong>
            <span class="muted"
              >pour le {day(a.dueOn)} · {a.questions} questions · {notionNames(a.notions)}</span
            >
          </div>
          <span class="state">{done}/{a.pupils.length} ✅</span>
          <button class="btn ghost small" onclick={() => remove(a)} aria-label="Supprimer"
            >🗑️</button
          >
        </div>
        <div class="pupils">
          {#each a.pupils as p (p.pupilId)}
            <span class="pupil" class:done={p.completedAt !== null}
              >{pupilName(p.pupilId)}
              {p.completedAt !== null ? '✅' : `${p.answered}/${a.questions}`}</span
            >
          {/each}
        </div>
      </li>
    {/each}
  </ul>
{/if}

{#if !open}
  <button class="btn small" disabled={detail.pupilList.length === 0} onclick={() => (open = true)}
    >➕ Donner un devoir</button
  >
{:else}
  <form onsubmit={create}>
    <div class="row">
      <div class="field">
        <label for="chw-title">Titre (facultatif)</label>
        <input id="chw-title" bind:value={title} maxlength="80" placeholder="Leçon du jour" />
      </div>
      <div class="field small">
        <label for="chw-count">Questions</label>
        <select id="chw-count" bind:value={questions}>
          {#each QUESTION_COUNTS as n (n)}<option value={n}>{n}</option>{/each}
        </select>
      </div>
      <div class="field small">
        <label for="chw-due">Pour le</label>
        <input id="chw-due" type="date" min={inDays(0)} bind:value={dueOn} required />
      </div>
      {#if detail.grades.length > 1}
        <div class="field small">
          <label for="chw-grade">Notions du</label>
          <select id="chw-grade" bind:value={grade}>
            {#each detail.grades as g (g)}<option value={g}>{g}</option>{/each}
          </select>
        </div>
      {/if}
    </div>
    <fieldset>
      <legend>Pour qui ?</legend>
      <label><input type="radio" bind:group={everyone} value={true} /> Toute la classe</label>
      <label><input type="radio" bind:group={everyone} value={false} /> Quelques élèves</label>
      {#if !everyone}
        <div class="choose">
          {#each detail.pupilList as p (p.id)}
            <label
              ><input
                type="checkbox"
                checked={pupils.has(p.id)}
                onchange={(e) => (e.currentTarget.checked ? pupils.add(p.id) : pupils.delete(p.id))}
              />
              {p.firstName}
              {p.lastName ?? ''}</label
            >
          {/each}
        </div>
      {/if}
    </fieldset>
    <NotionPicker {grade} {chosen} />
    <div class="row">
      <button class="btn ghost small" type="button" onclick={() => (open = false)}>Annuler</button>
      <button
        class="btn small"
        type="submit"
        disabled={chosen.size === 0 || (!everyone && pupils.size === 0)}>Donner le devoir</button
      >
    </div>
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
    gap: 10px;
  }
  .list li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }
  .line {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 10px;
  }
  .text {
    display: flex;
    flex-direction: column;
  }
  .state {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .pupils {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pupil {
    padding: 2px 10px;
    border-radius: 999px;
    background: #f3eff7;
    font-size: 0.85rem;
  }
  .pupil.done {
    background: #c8e6c9;
  }
  form {
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
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 6px 12px 10px;
  }
  legend {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .choose {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 4px 12px;
    width: 100%;
  }
  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  input[type='checkbox'],
  input[type='radio'] {
    accent-color: var(--primary);
  }
</style>
