<script lang="ts">
  import { figurePoint, type Figure, type GeometryAnswer, type GeoTool } from '@app/core';
  import FigureLayer from '../geometry/FigureLayer.svelte';
  import { bounds, clipLine, labelOffset, textAt } from '../geometry/svg';

  /**
   * Une figure sur papier, en vrais centimètres (à imprimer à 100 %). Avec solution, le corrigé
   * s'y ajoute en rouge : points ou traits entourés, traits tracés, points placés.
   */
  let {
    figure,
    tools = [],
    solution = null,
  }: { figure: Figure; tools?: GeoTool[]; solution?: GeometryAnswer | null } = $props();

  const CROSS = 0.16;
  const asLine = $derived(tools.some((t) => t.kind === 'draw' && t.as === 'line'));
  const placed = $derived(solution?.placed ?? []);

  function ends(a: string, b: string) {
    const p = figurePoint(figure, a, placed);
    const q = figurePoint(figure, b, placed);
    if (!p || !q) return null;
    return asLine ? clipLine(p, q, figure.width, figure.height) : [p, q];
  }
</script>

<svg
  class="paper-figure"
  width="{figure.width}cm"
  height="{figure.height}cm"
  viewBox="0 0 {figure.width} {figure.height}"
  role="img"
  aria-label="Figure"
>
  <FigureLayer {figure} {placed} />
  {#if solution}
    {#each solution.drawn as [a, b], i (i)}
      {@const line = ends(a, b)}
      {#if line}
        <line class="key" x1={line[0]!.x} y1={line[0]!.y} x2={line[1]!.x} y2={line[1]!.y} />
      {/if}
    {/each}
    {#each solution.picked as id (id)}
      {@const point = figurePoint(figure, id)}
      {@const path = figure.paths?.find((p) => p.id === id)}
      {#if point}
        <circle class="key ring" cx={point.x} cy={point.y} r="0.32" />
      {:else if path}
        {@const box = bounds(path.points)}
        <rect
          class="key ring"
          x={box.x - 0.45}
          y={box.y - 0.45}
          width={box.w + 0.9}
          height={box.h + (path.caption ? 1.55 : 0.9)}
          rx="0.5"
        />
      {/if}
    {/each}
    {#each placed as p (p.id)}
      {@const o = labelOffset('n')}
      <path
        class="key"
        d="M{p.x - CROSS},{p.y - CROSS} L{p.x + CROSS},{p.y + CROSS} M{p.x - CROSS},{p.y +
          CROSS} L{p.x + CROSS},{p.y - CROSS}"
      />
      <text class="key-label" transform={textAt(p.x + o.dx, p.y + o.dy)}>{p.id}</text>
    {/each}
  {/if}
</svg>

<style>
  .paper-figure {
    display: block;
    max-width: 100%;
    height: auto;
    border: 1px solid #bbb;
    border-radius: 4px;
    background: white;
  }
  .key {
    fill: none;
    stroke: #d32f2f;
    stroke-width: 0.05;
    stroke-linecap: round;
  }
  .ring {
    stroke-width: 0.045;
  }
  .key-label {
    font-size: 10px;
    font-weight: 700;
    fill: #d32f2f;
    text-anchor: middle;
  }
  @media print {
    /* À l'impression, la figure garde sa taille réelle. */
    .paper-figure {
      max-width: none;
    }
  }
</style>
