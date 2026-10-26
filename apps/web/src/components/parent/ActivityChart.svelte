<script lang="ts">
  import type { ChildReport } from '@app/core';

  /** Questions faites chaque jour : une barre par jour, le détail au survol ou au toucher. */
  let { days }: { days: ChildReport['days'] } = $props();

  const WIDTH = 300;
  const HEIGHT = 60;
  const GAP = 2;
  const max = $derived(Math.max(10, ...days.map((d) => d.questions)));
  const barWidth = $derived(WIDTH / days.length - GAP);
  let hovered = $state<number | null>(null);
  const shown = $derived(days[hovered ?? days.length - 1]);

  const label = (day: string) =>
    new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  /** Barre aux coins du haut arrondis, posée sur la ligne de base. */
  function bar(x: number, h: number): string {
    const r = Math.min(4, h, barWidth / 2);
    const y = HEIGHT - h;
    return `M${x},${HEIGHT} V${y + r} Q${x},${y} ${x + r},${y} H${x + barWidth - r} Q${x + barWidth},${y} ${x + barWidth},${y + r} V${HEIGHT} Z`;
  }
</script>

<div class="chart">
  <p class="detail" aria-live="polite">
    {#if shown}
      <strong>{label(shown.day)}</strong> :
      {#if shown.questions}
        {shown.questions} question{shown.questions > 1 ? 's' : ''}, {shown.firstTry} juste{shown.firstTry >
        1
          ? 's'
          : ''} du premier coup, {shown.minutes} min
      {:else}
        pas d’exercice
      {/if}
    {/if}
  </p>
  <svg
    viewBox="0 0 {WIDTH} {HEIGHT + 1}"
    role="img"
    aria-label="Questions faites chaque jour, sur {days.length} jours"
    onpointerleave={() => (hovered = null)}
  >
    <line class="baseline" x1="0" y1={HEIGHT + 0.5} x2={WIDTH} y2={HEIGHT + 0.5} />
    {#each days as d, i (d.day)}
      {@const x = i * (barWidth + GAP) + GAP / 2}
      {@const h = (d.questions / max) * (HEIGHT - 4)}
      {#if h > 0}
        <path class="bar" class:active={hovered === i} d={bar(x, Math.max(h, 2))} />
      {/if}
      <!-- Zone de survol plus large que la barre, sur toute la hauteur. -->
      <rect
        class="hit"
        x={x - GAP / 2}
        y="0"
        width={barWidth + GAP}
        height={HEIGHT}
        role="presentation"
        onpointerenter={() => (hovered = i)}
        onpointerdown={() => (hovered = i)}
      />
    {/each}
  </svg>
  <div class="axis">
    <span>il y a {days.length - 1} jours</span><span>aujourd’hui</span>
  </div>
</div>

<style>
  .chart {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  svg {
    width: 100%;
    display: block;
    overflow: visible;
  }
  .bar {
    fill: var(--primary-soft);
  }
  .bar.active {
    fill: var(--primary);
  }
  .baseline {
    stroke: #d6d0de;
    stroke-width: 1;
  }
  .hit {
    fill: transparent;
  }
  .detail {
    font-size: 0.95rem;
    min-height: 1.4em;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    color: var(--text-soft);
    font-size: 0.8rem;
  }
</style>
