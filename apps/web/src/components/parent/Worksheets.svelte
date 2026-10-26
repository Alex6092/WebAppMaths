<script lang="ts">
  import { registry } from '@app/content';
  import {
    buildWorksheet,
    expectedLevelOf,
    initialLevel,
    randomSeed,
    type AnyPlugin,
    type ChildDto,
    type SheetFormat,
    type SheetLevel,
    type WorksheetSpec,
  } from '@app/core';
  import { SvelteSet } from 'svelte/reactivity';
  import { api } from '../../lib/api';
  import { printable } from '../../lib/portal';
  import WorksheetPages from '../../print/WorksheetPages.svelte';
  import NotionPicker from './NotionPicker.svelte';

  /**
   * Préparer des fiches à imprimer pour un enfant : notions, nombre d'exercices, niveau, gabarit
   * (entraînement ou évaluation), variantes et corrigé. L'aperçu s'imprime tel quel.
   */
  let { child, onerror }: { child: ChildDto; onerror: (e: unknown) => void } = $props();

  const MAX_NOTIONS = 12;
  let open = $state(false);
  let title = $state('');
  let format = $state<SheetFormat>('practice');
  let level = $state<SheetLevel>('current');
  let exercises = $state(1);
  let variants = $state(1);
  let answerKey = $state(true);
  const chosen = new SvelteSet<string>();
  /** La fiche en aperçu. */
  let spec = $state<WorksheetSpec | null>(null);
  let levels = $state<Record<string, number>>({});

  $effect(() => {
    const id = child.id;
    api.get<Record<string, number>>(`children/${id}/levels`).then((rows) => {
      if (id === child.id) levels = rows;
    }, onerror);
  });

  const levelOf = (plugin: AnyPlugin) =>
    spec?.level === 'expected'
      ? expectedLevelOf(plugin)
      : (levels[plugin.id] ?? initialLevel(plugin, child.grade));
  const sheets = $derived(
    spec
      ? Array.from({ length: spec.variants }, (_, v) =>
          buildWorksheet(spec!, v, (id) => registry.pluginsOfNotion(id), levelOf),
        )
      : [],
  );

  function prepare(event: SubmitEvent) {
    event.preventDefault();
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    spec = {
      title:
        title.trim() || (format === 'evaluation' ? `Évaluation du ${date}` : `Fiche du ${date}`),
      // Dans l'ordre du catalogue, comme sur les évaluations de l'école.
      notions: registry.notions.filter((n) => chosen.has(n.id)).map((n) => n.id),
      exercises,
      level,
      format,
      variants,
      answerKey,
      seed: randomSeed(),
    };
  }
</script>

{#if !open}
  <button class="btn small" onclick={() => (open = true)}>🖨️ Préparer une fiche</button>
{:else}
  <form onsubmit={prepare}>
    <div class="row">
      <div class="field">
        <label for="ws-title">Titre (facultatif)</label>
        <input
          id="ws-title"
          bind:value={title}
          maxlength="80"
          placeholder="Révisions de la semaine"
        />
      </div>
      <div class="field small">
        <label for="ws-ex">Exercices par notion</label>
        <select id="ws-ex" bind:value={exercises}>
          {#each [1, 2, 3] as n (n)}<option value={n}>{n}</option>{/each}
        </select>
      </div>
      <div class="field small">
        <label for="ws-var">Fiches différentes</label>
        <select id="ws-var" bind:value={variants}>
          {#each [1, 2, 3] as n (n)}<option value={n}>{n}</option>{/each}
        </select>
      </div>
    </div>
    <div class="row choices">
      <fieldset>
        <legend>Gabarit</legend>
        <label
          ><input type="radio" bind:group={format} value="practice" /> Fiche d’entraînement</label
        >
        <label
          ><input type="radio" bind:group={format} value="evaluation" /> Évaluation (compétences, barème,
          A / ECA / NA)</label
        >
      </fieldset>
      <fieldset>
        <legend>Niveau des exercices</legend>
        <label
          ><input type="radio" bind:group={level} value="current" /> Celui de {child.firstName} dans l’app</label
        >
        <label
          ><input type="radio" bind:group={level} value="expected" /> Le niveau attendu en fin d’année</label
        >
      </fieldset>
      <label class="check"><input type="checkbox" bind:checked={answerKey} /> Avec le corrigé</label
      >
    </div>
    <NotionPicker grade={child.grade} {chosen} legend="Notions de la fiche" />
    <div class="row">
      <button class="btn ghost small" type="button" onclick={() => (open = false)}>Fermer</button>
      <button
        class="btn small"
        type="submit"
        disabled={chosen.size === 0 || chosen.size > MAX_NOTIONS}>Voir la fiche</button
      >
    </div>
    {#if chosen.size > MAX_NOTIONS}
      <p class="muted">{MAX_NOTIONS} notions au plus par fiche.</p>
    {/if}
  </form>
{/if}

{#if spec}
  <div class="overlay" use:printable role="dialog" aria-modal="true" aria-label="Fiche à imprimer">
    <div class="toolbar no-print">
      <button class="btn" onclick={() => window.print()}>🖨️ Imprimer</button>
      <button class="btn ghost" onclick={() => spec && (spec = { ...spec, seed: randomSeed() })}
        >🔄 Autres exercices</button
      >
      <button class="btn ghost" onclick={() => (spec = null)}>Fermer</button>
      <p>Pour que les mesures soient justes, imprime en « taille réelle » (100 %).</p>
    </div>
    {#each sheets as sheet (`${spec.seed}-${sheet.variant}`)}
      <WorksheetPages {spec} {sheet} firstName={child.firstName} grade={child.grade} />
    {/each}
  </div>
{/if}

<svelte:window onkeydown={(e) => e.key === 'Escape' && (spec = null)} />

<style>
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
  .choices {
    align-items: stretch;
  }
  .field {
    flex: 1;
    min-width: 160px;
  }
  .field.small {
    flex: 0 0 auto;
    min-width: 150px;
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
  .check {
    align-self: center;
    font-size: 0.92rem;
  }
  input[type='radio'],
  input[type='checkbox'] {
    accent-color: var(--primary);
  }
  .muted {
    color: var(--text-soft);
    font-size: 0.88rem;
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
