<script lang="ts">
  import { handAngles } from '@app/core';
  import { HOUR_LENGTH, MINUTE_LENGTH } from './dial';

  /**
   * Le cadran d'une horloge à aiguilles, à mettre dans un <svg> centré sur 0 (rayon 50 ; 62 avec
   * les minutes écrites autour). Sans minutes, le cadran est vide : les aiguilles sont à dessiner.
   */
  interface Props {
    minutes?: number | null;
    minuteLabels?: boolean;
    /** État de chaque aiguille (ok, wrong, expected…), pour la couleur de la correction. */
    hourState?: string;
    minuteState?: string;
    /** Couleur unique des deux aiguilles (le rouge du corrigé sur papier). */
    ink?: string;
  }
  let {
    minutes = null,
    minuteLabels = false,
    hourState = '',
    minuteState = '',
    ink,
  }: Props = $props();

  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const at = (deg: number, r: number) => ({ x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r });
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const angles = $derived(minutes === null ? null : handAngles(minutes));
</script>

<circle class="face" r="49" />
{#each ticks as i (i)}
  {@const big = i % 5 === 0}
  {@const a = at(i * 6, 48)}
  {@const b = at(i * 6, big ? 43.5 : 46)}
  <line class="tick" class:big x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
{/each}
{#if minuteLabels}
  {#each hours as h (h)}
    {@const p = at(h * 30, 56)}
    <text class="minute-label" x={p.x} y={p.y}>{h === 12 ? '00' : h * 5}</text>
  {/each}
{/if}
{#if angles}
  {@const hourTip = at(angles.hour, HOUR_LENGTH)}
  {@const minuteTip = at(angles.minute, MINUTE_LENGTH)}
  <line
    class="hand hour-hand {hourState}"
    x1="0"
    y1="0"
    x2={hourTip.x}
    y2={hourTip.y}
    style:stroke={ink}
  />
  <line
    class="hand minute-hand {minuteState}"
    x1="0"
    y1="0"
    x2={minuteTip.x}
    y2={minuteTip.y}
    style:stroke={ink}
  />
{/if}
<!-- Les nombres passent par-dessus la grande aiguille : on les lit toujours. -->
{#each hours as h (h)}
  {@const p = at(h * 30, 36)}
  <text class="hour" x={p.x} y={p.y}>{h}</text>
{/each}
<circle class="pin" r="2.6" style:fill={ink} />

<style>
  .face {
    fill: #fff;
    stroke: #37474f;
    stroke-width: 2.2;
  }
  .tick {
    stroke: #78909c;
    stroke-width: 0.6;
  }
  .tick.big {
    stroke: #37474f;
    stroke-width: 1.4;
  }
  .hour {
    font-size: 10.5px;
    font-weight: 700;
    fill: #263238;
    stroke: #fff;
    stroke-width: 2.4px;
    stroke-linejoin: round;
    paint-order: stroke;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .minute-label {
    font-size: 7px;
    font-weight: 700;
    fill: #1565c0;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .hand {
    stroke-linecap: round;
  }
  /* La petite aiguille (les heures) est courte et rouge, la grande (les minutes) longue et bleue. */
  .hour-hand {
    stroke: #c62828;
    stroke-width: 5.5;
  }
  .minute-hand {
    stroke: #1565c0;
    stroke-width: 3.4;
  }
  .hand.ok {
    stroke: var(--ok, #2e7d32);
  }
  .hand.wrong {
    stroke-dasharray: 4 3;
  }
  .hand.expected {
    stroke: var(--accent-dark, #e65100);
  }
  .pin {
    fill: #263238;
  }
</style>
