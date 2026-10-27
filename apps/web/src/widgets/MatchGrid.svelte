<script lang="ts">
  import type { MatchColumn } from '@app/core';
  import type { Snippet } from 'svelte';

  /**
   * La grille à relier, à l'écran comme sur papier : les colonnes de cartes et, entre deux
   * colonnes, les traits. Toutes les lignes ont la même hauteur : le milieu de la carte i est à
   * (i + ½) / n de la hauteur, sans rien mesurer, et le tracé reste juste à l'impression.
   */
  interface Props {
    columns: MatchColumn[];
    /** links[c][i] : la carte de la colonne c + 1 reliée à la carte i de la colonne c. */
    links: (number | null)[][];
    /** Classe de chaque trait (ok, wrong…). */
    lineState?: (c: number, i: number) => string;
    card: Snippet<[number, number, string, string | undefined]>;
    paper?: boolean;
  }
  let { columns, links, lineState = () => '', card, paper = false }: Props = $props();

  const rows = $derived(columns[0]?.cards.length ?? 0);
  const titled = $derived(columns.some((c) => c.title));
  const first = $derived(titled ? 2 : 1);
  const template = $derived(columns.map(() => 'minmax(0, 1fr)').join(paper ? ' 1.4cm ' : ' 64px '));
  const dot = $derived(paper ? 3 : 6);
  const at = (i: number) => `${((i + 0.5) / rows) * 100}%`;
</script>

<div
  class="grid"
  class:paper
  style:grid-template-columns={template}
  style:grid-template-rows="{titled ? 'auto ' : ''}repeat({rows}, 1fr)"
>
  {#each columns as column, c (c)}
    {#if titled}
      <div class="title" style:grid-column={2 * c + 1} style:grid-row="1">{column.title ?? ''}</div>
    {/if}
    {#each column.cards as item, i (i)}
      <div class="cell" style:grid-column={2 * c + 1} style:grid-row={first + i}>
        {@render card(c, i, item.text, item.icon)}
      </div>
    {/each}
    {#if c < columns.length - 1}
      <svg
        class="gutter"
        style:grid-column={2 * c + 2}
        style:grid-row="{first} / span {rows}"
        aria-hidden="true"
      >
        {#each links[c] ?? [] as j, i (i)}
          {#if j !== null && j !== undefined}
            <line class={lineState(c, i)} x1="0" y1={at(i)} x2="100%" y2={at(j)} />
          {/if}
        {/each}
        {#each column.cards as _card, i (i)}<circle cx="0" cy={at(i)} r={dot} />{/each}
        {#each columns[c + 1]?.cards ?? [] as _card, j (j)}<circle
            cx="100%"
            cy={at(j)}
            r={dot}
          />{/each}
      </svg>
    {/if}
  {/each}
</div>

<style>
  .grid {
    display: grid;
    width: 100%;
  }
  .title {
    padding: 6px 4px;
    margin-bottom: 4px;
    border-radius: 12px;
    background: var(--primary-soft);
    font-weight: 700;
    text-align: center;
    color: var(--primary-dark);
  }
  .cell {
    display: flex;
    padding: 6px 0;
    min-width: 0;
  }
  .gutter {
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  line {
    stroke: var(--primary);
    stroke-width: 4;
    stroke-linecap: round;
  }
  line.ok {
    stroke: var(--ok);
  }
  line.wrong {
    stroke: var(--wrong);
  }
  line.fixed {
    stroke: var(--accent-dark);
  }
  circle {
    fill: var(--text);
  }
  .paper .title {
    padding: 0.08cm;
    margin-bottom: 0.1cm;
    border: 1px solid #333;
    border-radius: 0.1cm;
    background: #eee;
    color: #000;
    font-size: 11pt;
  }
  .paper .cell {
    padding: 0.12cm 0;
  }
  .paper line {
    stroke: #d32f2f;
    stroke-width: 1.5;
  }
  .paper circle {
    fill: #000;
  }
</style>
