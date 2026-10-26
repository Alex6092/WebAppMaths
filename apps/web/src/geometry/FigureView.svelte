<script lang="ts">
  import type { Figure } from '@app/core';
  import FigureLayer from './FigureLayer.svelte';
  import Ruler, { restingPose, rulerLength } from './Ruler.svelte';
  import { PX_PER_CM } from './svg';

  /**
   * Une figure à regarder (et à mesurer si elle a une règle), au-dessus d'un énoncé. Avec rulerAt,
   * la règle est déjà posée sur la figure (le 0 en x, y), comme sur le dessin d'une leçon.
   */
  let { figure, rulerAt }: { figure: Figure; rulerAt?: { x: number; y: number; angle?: number } } =
    $props();

  /** Le bac de la règle, sous la figure. */
  const TRAY = 2;
  const hasRuler = $derived(figure.ruler || rulerAt !== undefined);
  const height = $derived(figure.height + (figure.ruler && !rulerAt ? TRAY : 0));
  // Revient à sa place à chaque nouvelle figure ; l'enfant la déplace ensuite.
  let pose = $derived(
    rulerAt ? { angle: 0, ...rulerAt } : restingPose(figure.width, figure.height),
  );
</script>

<svg
  class="figure"
  class:measurable={hasRuler}
  viewBox="0 0 {figure.width} {height}"
  style:max-width="{figure.width * PX_PER_CM}px"
  role="img"
  aria-label="Figure"
>
  <rect class="paper" width={figure.width} height={figure.height} rx="0.3" />
  {#if hasRuler}
    <Ruler
      length={rulerLength(figure.width)}
      bind:pose
      snapTo={figure.points}
      width={figure.width}
      {height}
    />
  {/if}
  <!-- La figure se voit à travers la règle, et ne gêne pas pour la prendre. -->
  <g class="drawing"><FigureLayer {figure} /></g>
</svg>

<style>
  .figure {
    width: 100%;
    display: block;
    user-select: none;
  }
  .figure.measurable {
    touch-action: none;
  }
  .drawing {
    pointer-events: none;
  }
  .paper {
    fill: white;
    stroke: #e3d9ec;
    stroke-width: 0.04;
  }
</style>
