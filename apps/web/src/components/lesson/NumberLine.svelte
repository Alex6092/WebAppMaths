<script lang="ts">
  import { textAt } from '../../geometry/svg';

  /** Droite graduée : les graduations, quelques nombres écrits et les nombres à repérer. */
  interface Props {
    from: number;
    to: number;
    step: number;
    labels: number[];
    points: number[];
  }
  let { from, to, step, labels, points }: Props = $props();

  /** Largeur du dessin (unités du SVG) et marge de chaque côté. */
  const WIDTH = 20;
  const MARGIN = 1;
  const Y = 2.4;

  const xOf = (n: number) => MARGIN + ((n - from) / (to - from)) * (WIDTH - 2 * MARGIN);
  const ticks = $derived(
    Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step),
  );
</script>

<svg
  class="number-line"
  viewBox="0 0 {WIDTH} 4.2"
  role="img"
  aria-label="Droite graduée de {from} à {to}"
>
  <line class="axis" x1="0.3" y1={Y} x2={WIDTH - 0.2} y2={Y} />
  <path class="axis" d="M{WIDTH - 0.6},{Y - 0.3} L{WIDTH - 0.2},{Y} L{WIDTH - 0.6},{Y + 0.3}" />
  {#each ticks as n (n)}
    {@const big = labels.includes(n)}
    <line
      class="tick"
      x1={xOf(n)}
      y1={Y - (big ? 0.4 : 0.25)}
      x2={xOf(n)}
      y2={Y + (big ? 0.4 : 0.25)}
    />
    {#if big}
      <text class="label" transform={textAt(xOf(n), Y + 1.3)} text-anchor="middle">{n}</text>
    {/if}
  {/each}
  {#each points as n (n)}
    <circle class="point" cx={xOf(n)} cy={Y} r="0.22" />
    <text class="point-label" transform={textAt(xOf(n), Y - 0.65)} text-anchor="middle">{n}</text>
  {/each}
</svg>

<style>
  .number-line {
    width: 100%;
    max-width: 520px;
    display: block;
    margin: 0 auto;
  }
  .axis,
  .tick {
    stroke: var(--text);
    stroke-width: 0.07;
    fill: none;
  }
  .label {
    font-size: 15px;
    fill: var(--text);
  }
  .point {
    fill: var(--primary);
  }
  .point-label {
    font-size: 16px;
    font-weight: 700;
    fill: var(--primary);
  }
</style>
