<script lang="ts">
  import type { Figure } from '@app/core';
  import FigureLayer from './FigureLayer.svelte';
  import Ruler, { restingPose, rulerLength } from './Ruler.svelte';
  import { PX_PER_CM } from './svg';

  /** Une figure à regarder (et à mesurer si elle a une règle), au-dessus d'un énoncé. */
  let { figure }: { figure: Figure } = $props();

  /** Le bac de la règle, sous la figure. */
  const TRAY = 2;
  const height = $derived(figure.height + (figure.ruler ? TRAY : 0));
  // Revient dans le bac à chaque nouvelle figure ; l'enfant la déplace ensuite.
  let pose = $derived(restingPose(figure.width, figure.height));
</script>

<svg
  class="figure"
  class:measurable={figure.ruler}
  viewBox="0 0 {figure.width} {height}"
  style:max-width="{figure.width * PX_PER_CM}px"
  role="img"
  aria-label="Figure"
>
  <rect class="paper" width={figure.width} height={figure.height} rx="0.3" />
  <FigureLayer {figure} />
  {#if figure.ruler}
    <Ruler
      length={rulerLength(figure.width)}
      bind:pose
      snapTo={figure.points}
      width={figure.width}
      {height}
    />
  {/if}
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
  .paper {
    fill: white;
    stroke: #e3d9ec;
    stroke-width: 0.04;
  }
</style>
