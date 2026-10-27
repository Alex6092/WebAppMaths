<script lang="ts">
  import { registry } from '@app/content';
  import {
    sheetLines,
    variantName,
    type PluginQuestion,
    type SheetExercise,
    type Worksheet,
    type WorksheetSpec,
  } from '@app/core';
  import PrintQuestion from './PrintQuestion.svelte';

  /**
   * Les pages d'une fiche : la page de l'élève puis, si demandé, son corrigé. Au gabarit
   * « évaluation », le tableau des compétences (barème et codes à remplir) ouvre la page.
   */
  let {
    spec,
    sheet,
    firstName,
    grade,
  }: { spec: WorksheetSpec; sheet: Worksheet; firstName: string; grade: string } = $props();

  const lines = $derived(sheetLines(sheet));
  const variant = $derived(spec.variants > 1 ? ` · fiche ${variantName(sheet.variant)}` : '');
  /** Une question avec une figure (à mesurer : elle s'imprime en vrais centimètres). */
  const withFigure = (q: PluginQuestion) =>
    q.widget === 'geometry' || ('figure' in q && q.figure !== undefined);
  const hasFigure = $derived(
    sheet.exercises.some((e) => e.items.some((i) => withFigure(i.question))),
  );
  const notion = (id: string) => registry.notion(id);

  /** Largeur d'une question : les petites tiennent à plusieurs par ligne. */
  const COLUMN: Partial<Record<string, string>> = {
    'column-op': '3.8cm',
    'number-input': '5.6cm',
    mcq: '7.5cm',
    'fill-blank': '8cm',
    clock: '4.2cm',
  };
  function columnWidth(e: SheetExercise): string {
    const first = e.items[0]?.question;
    if (!first || withFigure(first)) return '100%';
    // Une horloge à lire tient dans une colonne ; des pièces ou des horloges à choisir, non.
    if (first.widget === 'mcq' && first.choices.some((c) => c.picture)) return '100%';
    if ('picture' in first && first.picture)
      return first.picture.kind === 'clock' ? '5.6cm' : '100%';
    return COLUMN[first.widget] ?? '100%';
  }
  const solutionOf = (e: SheetExercise, i: number) =>
    registry.plugin(e.pluginId)?.solve(e.items[i]!.question) ?? null;
</script>

{#snippet page(key: boolean)}
  <section class="page" class:key>
    <header>
      <div class="title">
        <h1>{key ? 'Corrigé · ' : ''}{spec.title}{variant}</h1>
        <p class="kind">
          {spec.format === 'evaluation' ? 'Évaluation' : 'Fiche d’entraînement'} · {grade}
        </p>
      </div>
      {#if !key}
        <div class="identity">
          <span>Prénom : <strong>{firstName}</strong></span>
          <span>Date : <span class="fill"></span></span>
        </div>
      {/if}
    </header>

    {#if spec.format === 'evaluation'}
      <table class="skills">
        <thead>
          <tr><th>Compétence</th><th>Exercices</th><th>Barème</th><th>Code</th></tr>
        </thead>
        <tbody>
          {#each lines as line (line.notionId)}
            <tr>
              <td>{notion(line.notionId)?.competence ?? notion(line.notionId)?.title}</td>
              <td class="center">{line.exercises.join(', ')}</td>
              <td class="center score">( <span class="fill short"></span> / {line.total} )</td>
              <td class="center"><span class="codes">A · ECA · NA</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

    {#each sheet.exercises as e (e.number)}
      <article class="exercise">
        <h2>
          <span class="number">{e.number}</span>
          {e.instruction ?? registry.plugin(e.pluginId)?.title}
          {#if spec.format === 'evaluation'}<span class="points">/ {e.items.length}</span>{/if}
        </h2>
        <div class="items" style:--col={columnWidth(e)}>
          {#each e.items as item, i (item.seed)}
            <div class="item">
              {#if e.items.length > 1}<span class="letter">{String.fromCharCode(97 + i)})</span
                >{/if}
              <div class="body">
                {#if !e.instruction}<p class="own">{item.question.instruction}</p>{/if}
                <PrintQuestion question={item.question} solution={key ? solutionOf(e, i) : null} />
              </div>
            </div>
          {/each}
        </div>
      </article>
    {/each}

    <footer>
      {#if spec.format === 'evaluation' && !key}
        <p class="signature">Signature des parents :</p>
      {/if}
      {#if hasFigure}
        <p class="calibration">
          <span class="ten-cm"></span> Ce trait mesure 10 cm. Sinon, imprime « taille réelle » (100 %).
        </p>
      {/if}
    </footer>
  </section>
{/snippet}

{@render page(false)}
{#if spec.answerKey}{@render page(true)}{/if}

<style>
  .page {
    background: white;
    color: #111;
    width: 21cm;
    max-width: 100%;
    min-height: 29.7cm;
    /* Dans l'aperçu (colonne flex de hauteur fixe), une page longue ne doit pas être écrasée à
       29,7 cm : elle s'allonge, sinon son contenu déborde sur la page suivante. */
    flex-shrink: 0;
    padding: 1.2cm 1.4cm;
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 0.45cm;
    font-size: 12pt;
  }
  .page.key {
    border-top: 6px solid #d32f2f;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 0.3cm;
    border-bottom: 2px solid #222;
    padding-bottom: 0.25cm;
  }
  h1 {
    font-size: 17pt;
    margin: 0;
  }
  .kind {
    margin: 0;
    color: #555;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.15cm;
  }
  .fill {
    display: inline-block;
    min-width: 4cm;
    border-bottom: 1px solid #333;
  }
  .fill.short {
    min-width: 0.9cm;
  }
  .skills {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
  }
  .skills th,
  .skills td {
    border: 1px solid #888;
    padding: 0.1cm 0.2cm;
    text-align: left;
  }
  .skills th {
    background: #f1f1f1;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .center {
    text-align: center !important;
    white-space: nowrap;
  }
  .codes {
    color: #555;
    letter-spacing: 1px;
  }
  .exercise {
    break-inside: avoid;
  }
  h2 {
    display: flex;
    align-items: baseline;
    gap: 0.25cm;
    font-size: 12.5pt;
    margin: 0 0 0.2cm;
  }
  .number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0.65cm;
    height: 0.65cm;
    border-radius: 50%;
    border: 1.5px solid #222;
    font-size: 11pt;
  }
  .points {
    margin-left: auto;
    font-weight: 400;
    color: #555;
    white-space: nowrap;
  }
  .items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(var(--col), 100%), 1fr));
    gap: 0.35cm 0.6cm;
    padding-left: 0.4cm;
  }
  .item {
    display: flex;
    gap: 0.2cm;
    break-inside: avoid;
    min-width: 0;
  }
  .letter {
    font-weight: 700;
    padding-top: 0.2cm;
  }
  .body {
    min-width: 0;
    flex: 1;
  }
  .own {
    font-weight: 700;
    font-size: 11pt;
    margin: 0 0 0.1cm;
  }
  footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.3cm;
  }
  .signature {
    padding-bottom: 1cm;
    border-bottom: 1px dashed #999;
  }
  .calibration {
    display: flex;
    align-items: center;
    gap: 0.3cm;
    font-size: 9pt;
    color: #555;
  }
  .ten-cm {
    display: inline-block;
    width: 10cm;
    flex: 0 0 10cm;
    height: 0.25cm;
    border: 1px solid #333;
    border-top: none;
  }
  @media print {
    .page {
      width: auto;
      min-height: 0;
      padding: 0;
      box-shadow: none;
      break-after: page;
    }
    .page:last-of-type {
      break-after: auto;
    }
  }
</style>
