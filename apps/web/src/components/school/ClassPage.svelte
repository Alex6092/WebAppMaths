<script lang="ts">
  import { GRADE_IDS, type ClassroomDetail, type GradeId, type SchoolDto } from '@app/core';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import { navigate, route } from '../../lib/router.svelte';
  import { refreshMe, session } from '../../lib/session.svelte';
  import ClassAssessments from './ClassAssessments.svelte';
  import ClassFollowUp from './ClassFollowUp.svelte';
  import ClassHomework from './ClassHomework.svelte';
  import ClassNotions from './ClassNotions.svelte';
  import ClassWorksheets from './ClassWorksheets.svelte';
  import Pupils from './Pupils.svelte';

  /** Une classe : ses élèves, ses notions, ses devoirs, ses fiches, ses évaluations, le suivi. */
  let {
    school,
    classId,
    onerror,
    onchange,
  }: {
    school: SchoolDto;
    classId: number;
    onerror: (e: unknown) => void;
    /** L'école a changé (nombre d'élèves, enseignants, classe supprimée). */
    onchange: () => void;
  } = $props();

  const TABS = [
    ['eleves', '👧 Élèves'],
    ['notions', '📚 Notions'],
    ['devoirs', '📝 Devoirs'],
    ['fiches', '🖨️ Fiches'],
    ['evaluations', '📋 Évaluations'],
    ['suivi', '📊 Suivi'],
    ['reglages', '⚙️ Réglages'],
  ] as const;
  type Tab = (typeof TABS)[number][0];
  const tab = $derived<Tab>(
    (TABS.find(([id]) => id === route.query.get('vue'))?.[0] ?? 'eleves') as Tab,
  );

  let detail = $state<ClassroomDetail | null>(null);

  async function load() {
    try {
      detail = await api.get<ClassroomDetail>(`classes/${classId}`);
    } catch (e) {
      onerror(e);
    }
  }
  // Rechargée à chaque onglet : un parent a pu activer une fiche entre-temps.
  $effect(() => {
    void tab;
    void load();
  });

  function changed(next?: ClassroomDetail) {
    if (next) detail = next;
    else void load();
    onchange();
  }

  // --- Réglages ---
  let name = $state('');
  let grades = $state<GradeId[]>([]);
  let teacherIds = $state<number[]>([]);
  $effect(() => {
    if (detail && tab === 'reglages') {
      name = detail.name;
      grades = [...detail.grades];
      teacherIds = [...detail.teacherIds];
    }
  });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    try {
      const next = await api.patch<ClassroomDetail>(`classes/${classId}`, {
        name: name.trim(),
        grades,
        teacherIds,
      });
      await refreshMe();
      changed(next);
      toast('Classe enregistrée ✓');
      // Un enseignant qui se retire de la classe n'y a plus accès.
      if (!session.me?.schools.some((s) => s.classes.some((c) => c.id === classId)))
        navigate(`/ecole/${school.id}`);
    } catch (e) {
      onerror(e);
    }
  }

  async function remove() {
    if (
      !detail ||
      !confirm(
        `Supprimer la classe ${detail.name} ? Les élèves rattachés à une famille lui restent ; les autres sont supprimés, avec leur progression.`,
      )
    )
      return;
    try {
      await api.del(`classes/${classId}`);
      await refreshMe();
      onchange();
      navigate(`/ecole/${school.id}`);
    } catch (e) {
      onerror(e);
    }
  }

  const toggle = <T,>(list: T[], value: T, on: boolean) =>
    on ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value);
</script>

<div class="head">
  <a class="btn ghost small" href="#/ecole/{school.id}">⬅️ Classes</a>
  <h2>{detail?.name ?? '…'}</h2>
  {#if detail}<span class="muted">{detail.grades.join('-')} · {detail.schoolYear}</span>{/if}
</div>

<nav class="tabs">
  {#each TABS as [id, label] (id)}
    <a href="#/ecole/{school.id}/classe/{classId}?vue={id}" class:active={tab === id}>{label}</a>
  {/each}
</nav>

{#if detail}
  <section class="card">
    {#if tab === 'eleves'}
      <Pupils {detail} {school} {onerror} onchange={() => changed()} />
    {:else if tab === 'notions'}
      <ClassNotions {detail} {onerror} onchange={changed} />
    {:else if tab === 'devoirs'}
      <ClassHomework {detail} {onerror} />
    {:else if tab === 'fiches'}
      <ClassWorksheets {detail} {school} {onerror} />
    {:else if tab === 'evaluations'}
      <ClassAssessments {detail} {onerror} />
    {:else if tab === 'suivi'}
      <ClassFollowUp {detail} {onerror} />
    {:else}
      <form class="settings" onsubmit={save}>
        <div class="field">
          <label for="class-name">Nom de la classe</label>
          <input id="class-name" bind:value={name} maxlength="40" required />
        </div>
        <fieldset>
          <legend>Niveaux</legend>
          {#each GRADE_IDS as grade (grade)}
            <label
              ><input
                type="checkbox"
                checked={grades.includes(grade)}
                disabled={!grades.includes(grade) && grades.length >= 3}
                onchange={(e) =>
                  (grades = GRADE_IDS.filter((g) =>
                    toggle(grades, grade, e.currentTarget.checked).includes(g),
                  ))}
              />
              {grade}</label
            >
          {/each}
        </fieldset>
        <fieldset>
          <legend>Enseignants de la classe</legend>
          {#each school.members as m (m.userId)}
            <label
              ><input
                type="checkbox"
                checked={teacherIds.includes(m.userId)}
                onchange={(e) =>
                  (teacherIds = toggle(teacherIds, m.userId, e.currentTarget.checked))}
              />
              {m.email}</label
            >
          {/each}
        </fieldset>
        <div class="row">
          <button class="btn small" type="submit" disabled={grades.length === 0}>Enregistrer</button
          >
          <button class="btn danger small" type="button" onclick={remove}
            >Supprimer la classe</button
          >
        </div>
      </form>
    {/if}
  </section>
{/if}

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    width: 100%;
  }
  h2 {
    color: var(--primary);
    font-size: 1.4rem;
  }
  .muted {
    color: var(--text-soft);
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }
  .tabs a {
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface);
    color: var(--primary-dark);
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: var(--shadow);
  }
  .tabs a.active {
    background: var(--primary);
    color: white;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .settings {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 640px;
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
  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  input[type='checkbox'] {
    accent-color: var(--primary);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
