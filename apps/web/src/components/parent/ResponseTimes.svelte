<script lang="ts">
  import { registry } from '@app/content';
  import type { ChildReport, TimingPoint } from '@app/core';

  /**
   * Temps de première réponse par exercice : le temps habituel (médiane) des dernières
   * questions, comparé aux précédentes, et une courbe question par question.
   */
  let { timing }: { timing: ChildReport['timing'] } = $props();

  const W = 160;
  const H = 36;
  let hovered = $state<{ pluginId: string; point: TimingPoint } | null>(null);

  function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }

  /** Médiane des dernières questions et des précédentes (autant de chaque côté, 5 au plus). */
  function trend(points: TimingPoint[]) {
    const n = Math.min(5, Math.floor(points.length / 2));
    const recent = median(points.slice(-n).map((p) => p.ms));
    const before = median(points.slice(0, n).map((p) => p.ms));
    const ratio = recent / before;
    return {
      recent,
      before,
      kind: ratio < 0.85 ? 'faster' : ratio > 1.15 ? 'slower' : 'same',
    } as const;
  }

  const seconds = (ms: number) => {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
  };

  /** Les points de la courbe ; un temps très long (enfant parti) ne doit pas tout écraser. */
  function layout(points: TimingPoint[]) {
    const top = Math.max(
      ...points
        .map((p) => p.ms)
        .sort((a, b) => a - b)
        .slice(0, -1),
      5000,
    );
    return points.map((p, i) => ({
      p,
      x: points.length === 1 ? W / 2 : 4 + (i / (points.length - 1)) * (W - 8),
      y: H - 4 - (Math.min(p.ms, top) / top) * (H - 8),
    }));
  }

  const rows = $derived(
    timing.map((t) => ({ ...t, plugin: registry.plugin(t.pluginId), trend: trend(t.points) })),
  );
  const date = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
</script>

{#if rows.length === 0}
  <p class="muted">Pas encore assez de questions pour suivre le temps de réponse.</p>
{:else}
  <p class="muted legend">
    Temps habituel des dernières questions, comparé aux précédentes. Sur la courbe : ● juste du
    premier coup, ○ erreur. Touche un point pour le détail.
  </p>
  <ul class="rows">
    {#each rows as row (row.pluginId)}
      {@const dots = layout(row.points)}
      <li>
        <span class="name">{row.plugin?.icon} {row.plugin?.title}</span>
        <span class="value">
          <strong>{seconds(row.trend.recent)}</strong>
          <span class="trend {row.trend.kind}">
            {#if row.trend.kind === 'faster'}↘ plus rapide (avant {seconds(row.trend.before)})
            {:else if row.trend.kind === 'slower'}↗ plus lent (avant {seconds(row.trend.before)})
            {:else}→ stable{/if}
          </span>
        </span>
        <svg
          viewBox="0 0 {W} {H}"
          role="img"
          aria-label="Temps des {row.points.length} dernières questions"
          onpointerleave={() => (hovered = null)}
        >
          <polyline points={dots.map((d) => `${d.x},${d.y}`).join(' ')} />
          {#each dots as d, i (i)}
            <circle
              class:miss={!d.p.firstTry}
              class:active={hovered?.point === d.p}
              cx={d.x}
              cy={d.y}
              r="2.6"
            />
            <!-- Zone de toucher plus grande que le point. -->
            <rect
              class="hit"
              x={d.x - W / row.points.length / 2}
              y="0"
              width={W / row.points.length}
              height={H}
              role="presentation"
              onpointerenter={() => (hovered = { pluginId: row.pluginId, point: d.p })}
              onpointerdown={() => (hovered = { pluginId: row.pluginId, point: d.p })}
            />
          {/each}
        </svg>
        {#if hovered?.pluginId === row.pluginId}
          <span class="detail">
            {date(hovered.point.at)} · niveau {hovered.point.level} · {seconds(hovered.point.ms)} ·
            {hovered.point.firstTry ? 'juste du premier coup' : 'erreur'}
          </span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .muted {
    color: var(--text-soft);
  }
  .legend {
    font-size: 0.85rem;
  }
  .rows {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  li {
    display: grid;
    grid-template-columns: 1fr auto 160px;
    align-items: center;
    gap: 4px 12px;
    padding: 6px 0;
    border-bottom: 1px solid #eee;
    font-size: 0.92rem;
  }
  .value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .trend {
    font-size: 0.8rem;
    color: var(--text-soft);
  }
  .trend.faster {
    color: #2e7d32;
  }
  .trend.slower {
    color: #c62828;
  }
  svg {
    width: 160px;
    height: 36px;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: var(--primary-soft);
    stroke-width: 1.5;
  }
  circle {
    fill: var(--primary);
    stroke: var(--surface);
    stroke-width: 1;
  }
  circle.miss {
    fill: var(--surface);
    stroke: var(--primary);
    stroke-width: 1.2;
  }
  circle.active {
    r: 3.6;
  }
  .hit {
    fill: transparent;
  }
  .detail {
    grid-column: 1 / -1;
    justify-self: end;
    font-size: 0.82rem;
    color: var(--text-soft);
  }
  @media (max-width: 520px) {
    li {
      grid-template-columns: 1fr auto;
    }
    svg {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
</style>
