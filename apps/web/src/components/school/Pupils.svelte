<script lang="ts">
  import { untrack } from 'svelte';
  import type {
    ClassroomDetail,
    CreatedInvitation,
    GradeId,
    NewPupil,
    PupilCode,
    PupilDto,
    SchoolDto,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import { session } from '../../lib/session.svelte';
  import ParentSheets from './ParentSheets.svelte';
  import ResetSheet from './ResetSheet.svelte';

  /** Les élèves de la classe : ajout (une ligne par élève), modification, retrait, fiches parents. */
  let {
    detail,
    school,
    onerror,
    onchange,
  }: {
    detail: ClassroomDetail;
    school: SchoolDto;
    onerror: (e: unknown) => void;
    onchange: () => void;
  } = $props();

  const PLACEHOLDER = 'Léo M.\nZoé D.\nInès';
  let list = $state('');
  let grade = $state<GradeId>(untrack(() => detail.grades[0] ?? 'CP'));

  /** « Léo M. » → prénom Léo, nom M. ; le premier mot est le prénom. */
  function parse(text: string): NewPupil[] {
    return text
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .map((line) => {
        const [firstName = '', ...rest] = line.split(' ');
        return {
          firstName: firstName.slice(0, 30),
          ...(rest.length ? { lastName: rest.join(' ').slice(0, 40) } : {}),
          grade,
        };
      });
  }
  const parsed = $derived(parse(list));

  async function add(event: SubmitEvent) {
    event.preventDefault();
    try {
      await api.post<PupilDto[]>(`classes/${detail.id}/pupils`, { pupils: parsed });
      toast(
        `${parsed.length} élève${parsed.length > 1 ? 's' : ''} ajouté${parsed.length > 1 ? 's' : ''} ✓`,
      );
      list = '';
      onchange();
    } catch (e) {
      onerror(e);
    }
  }

  // --- Modification ---
  let editing = $state<number | null>(null);
  let form = $state({ firstName: '', lastName: '', grade: 'CP' as GradeId, classId: 0 });

  function edit(p: PupilDto) {
    editing = p.id;
    form = {
      firstName: p.firstName,
      lastName: p.lastName ?? '',
      grade: p.grade,
      classId: detail.id,
    };
  }

  /** Les classes où l'élève peut aller : celles que l'on gère dans l'école. */
  const classes = $derived.by(() => {
    const managed = new Set(
      session.me?.schools.find((s) => s.id === school.id)?.classes.map((c) => c.id) ?? [],
    );
    return school.classes.filter((c) => managed.has(c.id) || c.id === detail.id);
  });
  const target = $derived(classes.find((c) => c.id === form.classId));

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (editing === null) return;
    try {
      await api.patch(`pupils/${editing}`, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || null,
        grade: target?.grades.includes(form.grade) ? form.grade : (target?.grades[0] ?? form.grade),
        ...(form.classId !== detail.id ? { classId: form.classId } : {}),
      });
      editing = null;
      onchange();
    } catch (e) {
      onerror(e);
    }
  }

  async function remove(p: PupilDto) {
    const message = p.linked
      ? `Retirer ${p.firstName} de la classe ? Sa famille garde son profil.`
      : `Retirer ${p.firstName} de la classe ? Aucun parent n’a activé sa fiche : son profil et sa progression seront supprimés.`;
    if (!confirm(message)) return;
    try {
      await api.del(`pupils/${p.id}`);
      editing = null;
      onchange();
    } catch (e) {
      onerror(e);
    }
  }

  // --- Accès parent oublié (direction) ---
  let reset = $state<{ pupil: PupilDto; fiche: CreatedInvitation } | null>(null);

  async function parentReset(p: PupilDto) {
    if (
      !confirm(
        `Imprimer une fiche de réinitialisation pour les parents de ${p.firstName} ? Elle permet de choisir un nouveau mot de passe : ne la remets qu’à ses parents.`,
      )
    )
      return;
    try {
      reset = {
        pupil: p,
        fiche: await api.post<CreatedInvitation>(`pupils/${p.id}/parent-reset`),
      };
    } catch (e) {
      onerror(e);
    }
  }

  // --- Fiches parents ---
  const chosen = new SvelteSet<number>();
  const unlinked = $derived(detail.pupilList.filter((p) => !p.linked));
  let codes = $state<PupilCode[] | null>(null);

  async function printSheets() {
    const ids = chosen.size ? [...chosen] : unlinked.map((p) => p.id);
    const already = unlinked.filter((p) => ids.includes(p.id) && p.codeIssuedAt !== null);
    if (
      already.length > 0 &&
      !confirm(
        `${already.map((p) => p.firstName).join(', ')} ${already.length > 1 ? 'ont' : 'a'} déjà une fiche : les nouvelles fiches remplacent les anciennes, qui ne marcheront plus.`,
      )
    )
      return;
    try {
      codes = await api.post<PupilCode[]>(`classes/${detail.id}/pupil-codes`, { pupilIds: ids });
      chosen.clear();
      onchange();
    } catch (e) {
      onerror(e);
    }
  }

  const date = (ms: number) => new Date(ms).toLocaleDateString('fr-FR');
</script>

{#if detail.pupilList.length === 0}
  <p class="muted">Pas encore d’élève dans cette classe.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th><span class="sr">Fiche</span></th>
        <th>Élève</th>
        <th>Niveau</th>
        <th>Compte parent</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each detail.pupilList as p (p.id)}
        <tr>
          <td>
            {#if !p.linked}
              <input
                type="checkbox"
                aria-label="Imprimer la fiche de {p.firstName}"
                checked={chosen.has(p.id)}
                onchange={(e) => (e.currentTarget.checked ? chosen.add(p.id) : chosen.delete(p.id))}
              />
            {/if}
          </td>
          <td><span class="avatar">{p.avatar}</span> {p.firstName} {p.lastName ?? ''}</td>
          <td>{p.grade}</td>
          <td>
            {#if p.linked}✅ Activé
            {:else if p.codeIssuedAt}🖨️ Fiche du {date(p.codeIssuedAt)}
            {:else}<span class="muted">Fiche à imprimer</span>{/if}
          </td>
          <td class="actions">
            <button class="btn ghost small" onclick={() => edit(p)}>Modifier</button>
          </td>
        </tr>
        {#if editing === p.id}
          <tr class="edit-row">
            <td colspan="5">
              <form class="edit" onsubmit={save}>
                <div class="field">
                  <label for="p-first">Prénom</label>
                  <input id="p-first" bind:value={form.firstName} maxlength="30" required />
                </div>
                <div class="field">
                  <label for="p-last">Nom ou initiale</label>
                  <input id="p-last" bind:value={form.lastName} maxlength="40" />
                </div>
                <div class="field small">
                  <label for="p-class">Classe</label>
                  <select id="p-class" bind:value={form.classId}>
                    {#each classes as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
                  </select>
                </div>
                <div class="field small">
                  <label for="p-grade">Niveau</label>
                  <select id="p-grade" bind:value={form.grade}>
                    {#each target?.grades ?? detail.grades as g (g)}<option value={g}>{g}</option
                      >{/each}
                  </select>
                </div>
                <button class="btn small" type="submit">Enregistrer</button>
                <button class="btn ghost small" type="button" onclick={() => (editing = null)}
                  >Annuler</button
                >
                {#if p.linked && school.role === 'direction'}
                  <button class="btn ghost small" type="button" onclick={() => parentReset(p)}
                    >🔑 Accès parent oublié</button
                  >
                {/if}
                <button class="btn danger small" type="button" onclick={() => remove(p)}
                  >Retirer de la classe</button
                >
              </form>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
{/if}

<div class="sheets">
  <h3>🖨️ Fiches parents</h3>
  <p class="muted">
    Une fiche par élève, avec un QR code : le parent crée son compte (ou ajoute l’enfant à son
    compte, s’il a déjà un enfant dans l’app), et l’enfant peut s’entraîner à la maison.
  </p>
  <button class="btn small" disabled={unlinked.length === 0} onclick={printSheets}>
    {chosen.size
      ? `Imprimer ${chosen.size} fiche${chosen.size > 1 ? 's' : ''}`
      : `Imprimer les fiches (${unlinked.length})`}
  </button>
</div>

<form class="add" onsubmit={add}>
  <h3>Ajouter des élèves</h3>
  <div class="field">
    <label for="pupils">Un élève par ligne : le prénom, puis le nom ou son initiale</label>
    <textarea id="pupils" rows="5" bind:value={list} placeholder={PLACEHOLDER}></textarea>
  </div>
  <div class="row">
    {#if detail.grades.length > 1}
      <div class="field small">
        <label for="new-grade">Niveau</label>
        <select id="new-grade" bind:value={grade}>
          {#each detail.grades as g (g)}<option value={g}>{g}</option>{/each}
        </select>
      </div>
    {/if}
    <button class="btn small" type="submit" disabled={parsed.length === 0 || parsed.length > 40}>
      Ajouter {parsed.length || ''} élève{parsed.length > 1 ? 's' : ''}
    </button>
  </div>
  <p class="muted small">
    🔒 Pas d’e-mail ni de date de naissance : un prénom et une initiale suffisent.
  </p>
</form>

{#if reset}
  <ResetSheet
    reset={reset.fiche}
    firstName={reset.pupil.firstName}
    className={detail.name}
    schoolName={school.name}
    onclose={() => (reset = null)}
  />
{/if}

{#if codes}
  <ParentSheets
    {codes}
    pupils={detail.pupilList}
    className={detail.name}
    schoolName={school.name}
    onclose={() => (codes = null)}
  />
{/if}

<style>
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
  .avatar {
    font-size: 1.3rem;
  }
  .actions {
    text-align: right;
  }
  .edit-row td {
    background: #f7f4fb;
  }
  .edit,
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-end;
  }
  .field {
    flex: 1;
    min-width: 140px;
  }
  .field.small {
    flex: 0 0 auto;
    min-width: 110px;
  }
  .add,
  .sheets {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
  .sheets .btn {
    align-self: flex-start;
  }
  textarea {
    width: 100%;
    font: inherit;
    padding: 8px 10px;
    border-radius: 12px;
    border: 2px solid #e3d9ec;
  }
  h3 {
    color: var(--primary-dark);
  }
  .muted {
    color: var(--text-soft);
  }
  .small {
    font-size: 0.85rem;
  }
  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
