<script lang="ts">
  import { figurePoint, type Figure, type PlacedPoint } from '@app/core';
  import { bounds, clipLine, labelOffset, pathData, segmentDirection, textAt } from './svg';

  /** Le dessin d'une figure, sans interaction : à mettre dans un <svg> en centimètres. */
  interface Props {
    figure: Figure;
    /** Points placés par l'enfant : les segments de la figure peuvent s'y accrocher. */
    placed?: PlacedPoint[];
  }
  let { figure, placed = [] }: Props = $props();

  const TICK = 0.22;
  const CROSS = 0.16;

  const segments = $derived(
    (figure.segments ?? []).flatMap((s) => {
      const a = figurePoint(figure, s.from, placed);
      const b = figurePoint(figure, s.to, placed);
      if (!a || !b) return [];
      const [p, q] = s.kind === 'line' ? clipLine(a, b, figure.width, figure.height) : [a, b];
      return [{ p, q, dashed: s.dashed ?? false }];
    }),
  );

  function tick(x: number, y: number): string {
    const d = segmentDirection(figure, { x, y }) ?? { x: 1, y: 0 };
    // Petit trait perpendiculaire au segment.
    const nx = -d.y * TICK;
    const ny = d.x * TICK;
    return `M${x - nx},${y - ny} L${x + nx},${y + ny}`;
  }
</script>

{#if figure.frame}
  <rect class="frame" x="0.05" y="0.05" width={figure.width - 0.1} height={figure.height - 0.1} />
{/if}

{#each segments as s, i (i)}
  <line class="segment" class:dashed={s.dashed} x1={s.p.x} y1={s.p.y} x2={s.q.x} y2={s.q.y} />
{/each}

{#each figure.paths ?? [] as path (path.id)}
  {@const box = bounds(path.points)}
  <path class="segment" d={pathData(path.points, path.smooth)} />
  {#if path.dots}
    {#each [path.points[0], path.points[path.points.length - 1]] as end, i (i)}
      {#if end}<circle class="dot" cx={end[0]} cy={end[1]} r="0.09" />{/if}
    {/each}
  {/if}
  {#if path.caption}
    <text class="caption" transform={textAt(box.x + box.w / 2, box.y + box.h + 0.9)}
      >{path.caption}</text
    >
  {/if}
{/each}

{#each figure.texts ?? [] as t, i (i)}
  <text class="length" transform={textAt(t.x, t.y)}>{t.text}</text>
{/each}

{#each figure.points as p (p.id)}
  {#if p.mark === 'tick'}
    <path class="mark" d={tick(p.x, p.y)} />
  {:else if p.mark === 'dot'}
    <circle class="dot" cx={p.x} cy={p.y} r="0.09" />
  {:else if p.mark !== 'none'}
    <path
      class="mark"
      d="M{p.x - CROSS},{p.y - CROSS} L{p.x + CROSS},{p.y + CROSS} M{p.x - CROSS},{p.y +
        CROSS} L{p.x + CROSS},{p.y - CROSS}"
    />
  {/if}
  {#if p.label}
    {@const o = labelOffset(p.labelAt)}
    <text class="label" transform={textAt(p.x + o.dx, p.y + o.dy)} text-anchor={o.anchor}
      >{p.label}</text
    >
  {/if}
{/each}

<style>
  .frame {
    fill: none;
    stroke: #333;
    stroke-width: 0.04;
  }
  .segment {
    fill: none;
    stroke: #222;
    stroke-width: 0.05;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .segment.dashed {
    stroke: #8e8e8e;
    stroke-dasharray: 0.25 0.18;
  }
  .mark {
    stroke: #222;
    stroke-width: 0.05;
    stroke-linecap: round;
  }
  .dot {
    fill: #222;
  }
  .label {
    font-size: 10px;
    font-weight: 700;
    fill: #222;
  }
  .length {
    font-size: 8px;
    fill: #444;
    text-anchor: middle;
  }
  .caption {
    font-size: 9px;
    font-weight: 700;
    fill: #222;
    text-anchor: middle;
  }
</style>
