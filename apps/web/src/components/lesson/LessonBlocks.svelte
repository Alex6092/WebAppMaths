<script lang="ts">
  import type { LessonBlock } from '@app/core';
  import FigureView from '../../geometry/FigureView.svelte';
  import BaseTen from './BaseTen.svelte';
  import DotArray from './DotArray.svelte';
  import NumberLine from './NumberLine.svelte';
  import Operation from './Operation.svelte';
  import RichText from './RichText.svelte';

  /** Le contenu d'une fiche de leçon : paragraphes et illustrations, les uns sous les autres. */
  let { blocks }: { blocks: LessonBlock[] } = $props();
</script>

{#each blocks as block, b (b)}
  {#if typeof block === 'string'}
    <p><RichText text={block} /></p>
  {:else if block.kind === 'list'}
    <svelte:element this={block.ordered ? 'ol' : 'ul'} class="list">
      {#each block.items as item, i (i)}<li><RichText text={item} /></li>{/each}
    </svelte:element>
  {:else if block.kind === 'example'}
    <div class="example">
      {#each block.lines as line, i (i)}<div><RichText text={line} /></div>{/each}
    </div>
  {:else if block.kind === 'table'}
    <div class="table" style:grid-template-columns="repeat({block.columns.length}, minmax(0, 1fr))">
      {#each block.columns as column, c (c)}
        <div class="column" style:background={column.color}>
          <div class="column-title">{column.title}</div>
          {#each column.cells as cell, i (i)}<div class="cell"><RichText text={cell} /></div>{/each}
        </div>
      {/each}
    </div>
  {:else if block.kind === 'timeline'}
    <div class="timeline">
      {#each block.steps as step, i (i)}
        <div class="step" style:background={step.color}>
          <div class="step-title">{step.title}</div>
          <div class="step-text"><RichText text={step.text} /></div>
        </div>
      {/each}
    </div>
  {:else if block.kind === 'figure'}
    <figure>
      <FigureView figure={block.figure} rulerAt={block.ruler} />
      {#if block.caption}<figcaption><RichText text={block.caption} /></figcaption>{/if}
    </figure>
  {:else if block.kind === 'base-ten'}
    <BaseTen value={block.value} />
  {:else if block.kind === 'number-line'}
    <NumberLine
      from={block.from}
      to={block.to}
      step={block.step}
      labels={block.labels}
      points={block.points}
    />
  {:else if block.kind === 'operation'}
    <Operation op={block.op} operands={block.operands} />
  {:else if block.kind === 'array'}
    <figure>
      <DotArray rows={block.rows} cols={block.cols} />
      {#if block.caption}<figcaption><RichText text={block.caption} /></figcaption>{/if}
    </figure>
  {/if}
{/each}

<style>
  p,
  .list {
    font-size: 1.15rem;
    line-height: 1.55;
  }
  .list {
    padding-left: 1.4em;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .example {
    align-self: stretch;
    text-align: center;
    font-size: 1.45rem;
    line-height: 1.5;
    padding: 10px 14px;
    border: 2px dashed var(--primary-soft);
    border-radius: 16px;
    background: var(--surface);
  }
  .table {
    align-self: stretch;
    display: grid;
    border: 2px solid var(--text);
    border-radius: 10px;
    overflow: hidden;
  }
  .column {
    display: flex;
    flex-direction: column;
    text-align: center;
    background: var(--surface);
  }
  .column + .column {
    border-left: 2px solid var(--text);
  }
  .column-title {
    font-weight: 700;
    padding: 6px 4px;
    border-bottom: 2px solid var(--text);
    text-transform: uppercase;
  }
  .cell {
    padding: 3px 6px;
    font-size: 1.05rem;
  }
  .column-title + .cell {
    padding-top: 8px;
  }
  .cell:last-child {
    padding-bottom: 8px;
  }
  .timeline {
    align-self: stretch;
    display: flex;
    gap: 4px;
  }
  .step {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 18px 10px 16px;
    /* Une flèche vers la droite, comme une frise : le temps avance. */
    clip-path: polygon(
      0 0,
      calc(100% - 12px) 0,
      100% 50%,
      calc(100% - 12px) 100%,
      0 100%,
      12px 50%
    );
    text-align: center;
  }
  .step:first-child {
    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
    padding-left: 10px;
  }
  .step-title {
    font-weight: 700;
    text-transform: uppercase;
  }
  .step-text {
    font-size: 0.98rem;
  }
  figure {
    align-self: stretch;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  figcaption {
    font-size: 1rem;
    color: var(--text-soft);
    text-align: center;
  }
  @media (max-width: 520px) {
    .timeline {
      flex-direction: column;
    }
    .step,
    .step:first-child {
      clip-path: none;
      border-radius: 10px;
      padding: 8px 10px;
    }
  }
</style>
