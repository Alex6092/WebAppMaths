<script lang="ts">
  import type {
    ClassroomDto,
    GradeId,
    RolloverChoice,
    RolloverDto,
    RolloverResult,
    SchoolDto,
  } from '@app/core';
  import { onMount } from 'svelte';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import { refreshMe } from '../../lib/session.svelte';

  /**
   * La rentrée, pour la direction : chaque élève de l'année qui finit va dans une classe de
   * l'année suivante (au niveau suivant, ou maintenu), ou quitte l'école. Les choix sont
   * enregistrés au fur et à mesure ; « Faire la rentrée » les applique tous.
   */
  let {
    school,
    onerror,
    onchange,
  }: { school: SchoolDto; onerror: (e: unknown) => void; onchange: () => void } = $props();

  let plan = $state<RolloverDto | null>(null);
  let busy = $state(false);

  async function load() {
    try {
      plan = await api.get<RolloverDto>(`schools/${school.id}/rollover`);
    } catch (e) {
      onerror(e);
    }
  }
  onMount(load);

  async function choose(choices: RolloverChoice[]) {
    if (choices.length === 0) return;
    try {
      plan = await api.put<RolloverDto>(`schools/${school.id}/rollover`, { choices });
    } catch (e) {
      onerror(e);
      await load();
    }
  }

  /** La valeur de la liste : '' à répartir, 'quitte', ou l'id de la classe d'arrivée. */
  const valueOf = (choice: RolloverDto['fromClasses'][number]['pupils'][number]['choice']) =>
    choice === null ? '' : choice === 'quitte' ? 'quitte' : String(choice.classId);
  const choiceOf = (pupilId: number, value: string): RolloverChoice =>
    value === 'quitte'
      ? { pupilId, leaves: true }
      : { pupilId, classId: value ? Number(value) : null };
  const target = (classId: number): ClassroomDto | undefined =>
    plan?.toClasses.find((c) => c.id === classId);

  const pupils = $derived(plan?.fromClasses.flatMap((c) => c.pupils) ?? []);
  const counts = $derived({
    toAssign: pupils.filter((p) => p.choice === null).length,
    moving: pupils.filter((p) => p.choice !== null && p.choice !== 'quitte').length,
    leavingLinked: pupils.filter((p) => p.choice === 'quitte' && p.linked).length,
    leavingAlone: pupils.filter((p) => p.choice === 'quitte' && !p.linked).length,
  });

  async function apply() {
    if (!plan) return;
    const lines = [
      `${counts.moving} élève${counts.moving > 1 ? 's' : ''} passent dans leur classe de ${plan.to}.`,
      counts.leavingLinked
        ? `${counts.leavingLinked} quitte${counts.leavingLinked > 1 ? 'nt' : ''} l’école et reste${counts.leavingLinked > 1 ? 'nt' : ''} à sa famille.`
        : '',
      counts.leavingAlone
        ? `${counts.leavingAlone} quitte${counts.leavingAlone > 1 ? 'nt' : ''} l’école sans compte parent : profil et progression supprimés.`
        : '',
      `Les classes de ${plan.from} seront supprimées. Continuer ?`,
    ].filter(Boolean);
    if (!confirm(lines.join('\n'))) return;
    busy = true;
    try {
      const result = await api.post<RolloverResult>(`schools/${school.id}/rollover/apply`);
      toast(
        `Rentrée faite ✓ ${result.moved} élève${result.moved > 1 ? 's' : ''} dans leur nouvelle classe.`,
      );
      await refreshMe();
      onchange();
      await load();
    } catch (e) {
      onerror(e);
    } finally {
      busy = false;
    }
  }
</script>

<section class="card">
  {#if !plan}
    <p class="muted">Chargement…</p>
  {:else}
    <h2>Rentrée {plan.to}</h2>
    <p class="muted">
      Pour chaque élève de {plan.from}, choisis sa classe de {plan.to} (au niveau suivant, ou au même
      niveau s’il est maintenu), ou « quitte l’école ». Tes choix sont enregistrés au fur et à mesure.
      Fais la rentrée quand tu veux (fin juin ou début septembre) : les élèves gardent leur progression
      et leur famille.
    </p>

    {#if plan.toClasses.length === 0}
      <p class="notice">
        Crée d’abord les classes de {plan.to} :
        <a href="#/ecole/{school.id}">onglet Classes</a>, année « {plan.to} (rentrée) ».
      </p>
    {/if}

    {#if plan.fromClasses.length === 0}
      <p class="muted">Pas de classe en {plan.from}.</p>
    {/if}

    {#each plan.fromClasses as c (c.id)}
      <div class="class">
        <div class="class-head">
          <h3>{c.name} <span class="muted">({c.grades.join('-')})</span></h3>
          {#if c.pupils.length && plan.toClasses.length}
            <select
              aria-label="Toute la classe {c.name}"
              value=""
              onchange={(e) => {
                const value = e.currentTarget.value;
                e.currentTarget.value = '';
                void choose(c.pupils.map((p) => choiceOf(p.id, value)));
              }}
            >
              <option value="" disabled>Toute la classe…</option>
              {#each plan.toClasses as t (t.id)}<option value={String(t.id)}>→ {t.name}</option
                >{/each}
              <option value="quitte">Quittent l’école</option>
            </select>
          {/if}
        </div>
        {#if c.pupils.length === 0}
          <p class="muted">Pas d’élève.</p>
        {:else}
          <table>
            <thead><tr><th>Élève</th><th>À la rentrée</th><th>Niveau</th></tr></thead>
            <tbody>
              {#each c.pupils as p (p.id)}
                {@const chosen = p.choice !== null && p.choice !== 'quitte' ? p.choice : null}
                <tr class:todo={p.choice === null}>
                  <td
                    >{p.avatar}
                    {p.firstName}
                    {p.lastName ?? ''} <span class="muted">{p.grade}</span></td
                  >
                  <td>
                    <select
                      aria-label="Rentrée de {p.firstName}"
                      value={valueOf(p.choice)}
                      onchange={(e) => choose([choiceOf(p.id, e.currentTarget.value)])}
                    >
                      <option value="">— à répartir —</option>
                      {#each plan.toClasses as t (t.id)}<option value={String(t.id)}
                          >{t.name}</option
                        >{/each}
                      <option value="quitte">Quitte l’école</option>
                    </select>
                  </td>
                  <td>
                    {#if chosen}
                      <select
                        aria-label="Niveau de {p.firstName} à la rentrée"
                        value={chosen.grade}
                        onchange={(e) =>
                          choose([
                            {
                              pupilId: p.id,
                              classId: chosen.classId,
                              grade: e.currentTarget.value as GradeId,
                            },
                          ])}
                      >
                        {#each target(chosen.classId)?.grades ?? [] as g (g)}
                          <option value={g}>{g}{g === p.grade ? ' (maintien)' : ''}</option>
                        {/each}
                      </select>
                    {:else if p.choice === 'quitte'}
                      <span class="muted"
                        >{p.linked ? 'reste à sa famille' : 'profil supprimé'}</span
                      >
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {/each}

    {#if pupils.length > 0}
      <div class="summary">
        <p>
          <strong>{counts.toAssign}</strong> à répartir · {counts.moving} changent de classe ·
          {counts.leavingLinked + counts.leavingAlone} quittent l’école
        </p>
        <button
          class="btn"
          disabled={busy || counts.toAssign > 0 || plan.fromClasses.length === 0}
          onclick={apply}>Faire la rentrée {plan.to}</button
        >
      </div>
    {/if}
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    color: var(--primary);
    font-size: 1.25rem;
  }
  h3 {
    color: var(--primary-dark);
  }
  .muted {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  .notice {
    padding: 10px 14px;
    border-radius: 12px;
    background: #fff8e1;
  }
  .class {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 10px;
  }
  .class-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 4px;
    border-bottom: 1px solid #eee;
  }
  tr.todo td:first-child {
    font-weight: 700;
  }
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
</style>
