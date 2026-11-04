<script lang="ts">
  import { untrack } from 'svelte';
  import { registry } from '@app/content';
  import {
    buildWorksheet,
    expectedLevelOf,
    initialLevel,
    randomSeed,
    type AnyPlugin,
    type ClassroomDetail,
    type GradeId,
    type PupilDto,
    type SchoolDto,
    type SheetFormat,
    type SheetLevel,
    type WorksheetSpec,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { printable } from '../../lib/portal';
  import WorksheetPages from '../../print/WorksheetPages.svelte';
  import NotionPicker from '../parent/NotionPicker.svelte';

  /**
   * Fiches à imprimer pour la classe : une fiche commune (au niveau attendu, en plusieurs
   * versions), ou une fiche par élève, à son prénom et à son niveau dans l'app.
   */
  let {
    detail,
    school,
    onerror,
  }: { detail: ClassroomDetail; school: SchoolDto; onerror: (e: unknown) => void } = $props();

  const MAX_NOTIONS = 12;
  let title = $state('');
  let format = $state<SheetFormat>('practice');
  let target = $state<'classe' | 'eleves'>('classe');
  let level = $state<SheetLevel>('expected');
  let exercises = $state(1);
  let variants = $state(1);
  let answerKey = $state(true);
  let grade = $state<GradeId>(untrack(() => detail.grades[0] ?? 'CP'));
  const chosen = new SvelteSet<string>();
  const pupils = new SvelteSet<number>();

  let spec = $state<WorksheetSpec | null>(null);
  /** Niveau de chaque élève dans chaque exercice déjà travaillé. */
  let levels = $state<Record<number, Record<string, number>>>({});

  /** Les élèves de la fiche (du niveau choisi, pour une classe à plusieurs niveaux). */
  const gradePupils = $derived(detail.pupilList.filter((p) => p.grade === grade));
  const printed = $derived(
    target === 'classe' ? [] : gradePupils.filter((p) => pupils.size === 0 || pupils.has(p.id)),
  );

  function levelOf(plugin: AnyPlugin, pupil: PupilDto | null): number {
    if (spec?.level === 'expected' || !pupil) return expectedLevelOf(plugin);
    return levels[pupil.id]?.[plugin.id] ?? initialLevel(plugin, pupil.grade);
  }

  /** Les fiches : une par version pour la classe, ou une par élève. */
  const sheets = $derived.by(() => {
    if (!spec) return [];
    const s = spec;
    if (target === 'classe')
      return Array.from({ length: s.variants }, (_, v) => ({
        key: `v${v}`,
        firstName: '',
        sheet: buildWorksheet(
          s,
          v,
          (id) => registry.pluginsOfNotion(id),
          (p) => levelOf(p, null),
        ),
      }));
    return printed.map((pupil, i) => ({
      key: `p${pupil.id}`,
      firstName: pupil.firstName,
      // Deux voisins n'ont pas les mêmes questions.
      sheet: buildWorksheet(
        { ...s, seed: (s.seed + i * 7919) >>> 0 },
        0,
        (id) => registry.pluginsOfNotion(id),
        (p) => levelOf(p, pupil),
      ),
    }));
  });

  async function prepare(event: SubmitEvent) {
    event.preventDefault();
    if (target === 'eleves' && level === 'current') {
      try {
        levels = await api.get<Record<number, Record<string, number>>>(
          `classes/${detail.id}/levels`,
        );
      } catch (e) {
        onerror(e);
        return;
      }
    }
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    spec = {
      title:
        title.trim() || (format === 'evaluation' ? `Évaluation du ${date}` : `Fiche du ${date}`),
      notions: registry.notions.filter((n) => chosen.has(n.id)).map((n) => n.id),
      exercises,
      level: target === 'classe' ? 'expected' : level,
      format,
      variants: target === 'classe' ? variants : 1,
      answerKey,
      seed: randomSeed(),
    };
  }
</script>

<p class="muted">
  Des fiches sur papier pour la classe ({school.name}), avec leur corrigé. Une fiche par élève
  reprend le niveau de chacun dans l’app : pratique pour ceux qui ont besoin de plus d’entraînement.
</p>

<form onsubmit={prepare}>
  <div class="row">
    <div class="field">
      <label for="cws-title">Titre (facultatif)</label>
      <input
        id="cws-title"
        bind:value={title}
        maxlength="80"
        placeholder="Révisions de la semaine"
      />
    </div>
    <div class="field small">
      <label for="cws-ex">Exercices par notion</label>
      <select id="cws-ex" bind:value={exercises}>
        {#each [1, 2, 3] as n (n)}<option value={n}>{n}</option>{/each}
      </select>
    </div>
    {#if detail.grades.length > 1}
      <div class="field small">
        <label for="cws-grade">Niveau</label>
        <select id="cws-grade" bind:value={grade}>
          {#each detail.grades as g (g)}<option value={g}>{g}</option>{/each}
        </select>
      </div>
    {/if}
  </div>
  <div class="row choices">
    <fieldset>
      <legend>Gabarit</legend>
      <label><input type="radio" bind:group={format} value="practice" /> Fiche d’entraînement</label
      >
      <label
        ><input type="radio" bind:group={format} value="evaluation" /> Évaluation (compétences, barème,
        A / ECA / NA)</label
      >
    </fieldset>
    <fieldset>
      <legend>Pour qui ?</legend>
      <label
        ><input type="radio" bind:group={target} value="classe" /> La même fiche pour toute la classe
        (niveau attendu)</label
      >
      <label
        ><input type="radio" bind:group={target} value="eleves" /> Une fiche par élève, à son prénom</label
      >
    </fieldset>
    {#if target === 'classe'}
      <div class="field small">
        <label for="cws-var">Versions différentes</label>
        <select id="cws-var" bind:value={variants}>
          {#each [1, 2, 3] as n (n)}<option value={n}>{n}</option>{/each}
        </select>
      </div>
    {:else}
      <fieldset>
        <legend>Niveau des exercices</legend>
        <label
          ><input type="radio" bind:group={level} value="current" /> Celui de chaque élève dans l’app</label
        >
        <label
          ><input type="radio" bind:group={level} value="expected" /> Le niveau attendu en fin d’année</label
        >
      </fieldset>
    {/if}
    <label class="check"><input type="checkbox" bind:checked={answerKey} /> Avec le corrigé</label>
  </div>
  {#if target === 'eleves'}
    <fieldset>
      <legend>Élèves ({pupils.size === 0 ? 'tous' : pupils.size})</legend>
      <div class="choose">
        {#each gradePupils as p (p.id)}
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
    </fieldset>
  {/if}
  <NotionPicker {grade} {chosen} legend="Notions de la fiche" />
  <div class="row">
    <button
      class="btn small"
      type="submit"
      disabled={chosen.size === 0 ||
        chosen.size > MAX_NOTIONS ||
        (target === 'eleves' && printed.length === 0)}>Voir les fiches</button
    >
  </div>
  {#if chosen.size > MAX_NOTIONS}<p class="muted">{MAX_NOTIONS} notions au plus par fiche.</p>{/if}
</form>

{#if spec}
  <div class="overlay" use:printable role="dialog" aria-modal="true" aria-label="Fiches à imprimer">
    <div class="toolbar no-print">
      <button class="btn" onclick={() => window.print()}>🖨️ Imprimer</button>
      <button class="btn ghost" onclick={() => spec && (spec = { ...spec, seed: randomSeed() })}
        >🔄 Autres exercices</button
      >
      <button class="btn ghost" onclick={() => (spec = null)}>Fermer</button>
      <p>
        {sheets.length} fiche{sheets.length > 1 ? 's' : ''}. Pour que les mesures soient justes,
        imprime en « taille réelle » (100 %).
      </p>
    </div>
    {#each sheets as s (`${spec.seed}-${s.key}`)}
      <WorksheetPages {spec} sheet={s.sheet} firstName={s.firstName} {grade} />
    {/each}
  </div>
{/if}

<svelte:window onkeydown={(e) => e.key === 'Escape' && (spec = null)} />

<style>
  .muted {
    color: var(--text-soft);
    font-size: 0.9rem;
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
  .choices {
    align-items: stretch;
  }
  .field {
    flex: 1;
    min-width: 160px;
  }
  .field.small {
    flex: 0 0 auto;
    min-width: 140px;
  }
  fieldset {
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 6px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.92rem;
  }
  legend {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .choose {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 4px 12px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .check {
    align-self: center;
    font-size: 0.92rem;
  }
  input[type='radio'],
  input[type='checkbox'] {
    accent-color: var(--primary);
  }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 55;
    overflow-y: auto;
    background: #6d6478;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 16px 16px 40px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 16px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .toolbar p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-soft);
  }
  @media print {
    .overlay {
      position: static;
      display: block;
      background: none;
      padding: 0;
      overflow: visible;
    }
  }
</style>
