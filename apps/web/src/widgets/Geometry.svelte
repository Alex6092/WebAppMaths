<script lang="ts">
  import {
    distance,
    distanceToLine,
    figurePoint,
    projectOnLine,
    roundCm,
    type GeoTool,
    type Pt,
  } from '@app/core';
  import { untrack } from 'svelte';
  import FigureLayer from '../geometry/FigureLayer.svelte';
  import Ruler, { restingPose, rulerLength, type RulerPose } from '../geometry/Ruler.svelte';
  import { bounds, clipLine, labelOffset, PX_PER_CM, textAt, toFigure } from '../geometry/svg';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'geometry'> = $props();

  /** Distance (cm) à laquelle un toucher attrape un point. */
  const HIT = 0.6;
  /** Un point placé près d'un trait ou du bord de la règle vient se poser dessus. */
  const SNAP = 0.3;
  /** Le bac de la règle, sous la figure. */
  const TRAY = 2;
  const CROSS = 0.18;

  const TOOL_NAMES: Record<GeoTool['kind'], string> = {
    pick: '⭕ Entourer',
    draw: '✏️ Tracer',
    place: '📍 Placer',
  };

  const locked = $derived(isLocked(phase));
  const figure = $derived(question.figure);
  const tools = $derived(question.tools);
  const height = $derived(figure.height + (figure.ruler ? TRAY : 0));

  let mode = $state<GeoTool['kind']>(untrack(() => question.tools[0]!.kind));
  let showRuler = $state(true);
  let pose = $state<RulerPose>(
    untrack(() => restingPose(question.figure.width, question.figure.height)),
  );
  let svg = $state<SVGSVGElement>();

  const drawTool = $derived(tools.find((t) => t.kind === 'draw'));
  const pickTargets = $derived(tools.flatMap((t) => (t.kind === 'pick' ? t.targets : [])));
  const placeLabels = $derived(tools.flatMap((t) => (t.kind === 'place' ? t.labels : [])));
  const nextLabel = $derived(placeLabels.find((l) => !answer.placed.some((p) => p.id === l)));
  const visiblePoints = $derived(figure.points.filter((p) => p.mark !== 'none'));
  const snapPoints = $derived([...visiblePoints, ...answer.placed]);
  const canUndo = $derived(
    mode === 'place'
      ? answer.placed.length > 0
      : mode === 'draw'
        ? answer.drawn.length > 0
        : answer.picked.length > 0,
  );

  const hint = $derived(
    mode === 'draw'
      ? 'Glisse d’un point à un autre, ou touche les deux points.'
      : mode === 'place'
        ? nextLabel
          ? `Touche la figure pour placer le point ${nextLabel}.`
          : 'Fais glisser un point pour le déplacer.'
        : 'Touche pour entourer, touche encore pour effacer.',
  );

  /** Trait tiré du doigt pendant un tracé ; premier point d'un tracé « toucher-toucher ». */
  let rubber = $state<{ from: string; to: Pt } | null>(null);
  let pending = $state<string | null>(null);
  let dragging: { id: string; dx: number; dy: number } | null = null;

  function nearestPoint(p: Pt, ids?: readonly string[]): string | null {
    let best: string | null = null;
    let bestDistance = HIT;
    for (const q of ids ? figure.points.filter((q) => ids.includes(q.id)) : visiblePoints) {
      const d = distance(p, q);
      if (d < bestDistance) {
        best = q.id;
        bestDistance = d;
      }
    }
    return best;
  }

  function pickAt(p: Pt): string | null {
    const point = nearestPoint(p, pickTargets);
    if (point) return point;
    const path = (figure.paths ?? []).find((path) => {
      if (!pickTargets.includes(path.id)) return false;
      const box = bounds(path.points);
      return (
        p.x > box.x - 0.6 &&
        p.x < box.x + box.w + 0.6 &&
        p.y > box.y - 0.6 &&
        p.y < box.y + box.h + 0.6
      );
    });
    return path?.id ?? null;
  }

  /** Les traits où un point placé vient s'aimanter (sauf ceux qui partent de ce point). */
  function guides(id: string): [Pt, Pt][] {
    const pairs: [string, string][] = [
      ...answer.drawn,
      ...(figure.segments ?? []).map((s): [string, string] => [s.from, s.to]),
    ];
    const lines = pairs.flatMap(([a, b]): [Pt, Pt][] => {
      if (a === id || b === id) return [];
      const p = figurePoint(figure, a, answer.placed);
      const q = figurePoint(figure, b, answer.placed);
      return p && q ? [[p, q]] : [];
    });
    if (figure.ruler && showRuler) {
      const angle = (pose.angle * Math.PI) / 180;
      lines.push([pose, { x: pose.x + Math.cos(angle), y: pose.y + Math.sin(angle) }]);
    }
    return lines;
  }

  function settle(p: Pt, id: string): Pt {
    let best = p;
    let bestDistance = SNAP;
    for (const [a, b] of guides(id)) {
      const d = distanceToLine(p, a, b);
      if (d < bestDistance) {
        best = projectOnLine(p, a, b);
        bestDistance = d;
      }
    }
    const x = Math.max(0.2, Math.min(figure.width - 0.2, best.x));
    const y = Math.max(0.2, Math.min(figure.height - 0.2, best.y));
    return { x: roundCm(x), y: roundCm(y) };
  }

  function addLine(a: string, b: string) {
    pending = null;
    const exists = answer.drawn.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
    if (!exists && answer.drawn.length < 12) answer.drawn = [...answer.drawn, [a, b]];
  }

  function toggle(id: string) {
    answer.picked = answer.picked.includes(id)
      ? answer.picked.filter((p) => p !== id)
      : [...answer.picked, id];
  }

  function onpointerdown(event: PointerEvent) {
    if (locked || !svg || event.button > 0) return;
    const p = toFigure(svg, event);
    if (mode === 'place') {
      const hit = answer.placed.find((q) => distance(q, p) < HIT);
      if (hit) dragging = { id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
      else if (nextLabel && p.y < figure.height) {
        const q = settle(p, nextLabel);
        answer.placed = [...answer.placed, { id: nextLabel, ...q }];
        dragging = { id: nextLabel, dx: p.x - q.x, dy: p.y - q.y };
      } else return;
    } else if (mode === 'draw') {
      const id = nearestPoint(p);
      if (!id) {
        pending = null;
        return;
      }
      rubber = { from: id, to: p };
    } else {
      const id = pickAt(p);
      if (id) toggle(id);
      return;
    }
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onpointermove(event: PointerEvent) {
    if (!svg || (!dragging && !rubber)) return;
    const p = toFigure(svg, event);
    if (dragging) {
      const { id, dx, dy } = dragging;
      const q = settle({ x: p.x - dx, y: p.y - dy }, id);
      answer.placed = answer.placed.map((point) => (point.id === id ? { id, ...q } : point));
    } else if (rubber) rubber = { ...rubber, to: p };
  }

  function onpointerup(event: PointerEvent) {
    dragging = null;
    if (!rubber || !svg) return;
    const from = rubber.from;
    const to = nearestPoint(toFigure(svg, event));
    rubber = null;
    if (to && to !== from) addLine(from, to);
    else if (to === from) {
      if (pending && pending !== from) addLine(pending, from);
      else pending = pending === from ? null : from;
    }
  }

  function undo() {
    pending = null;
    if (mode === 'place') answer.placed = answer.placed.slice(0, -1);
    else if (mode === 'draw') answer.drawn = answer.drawn.slice(0, -1);
    else answer.picked = answer.picked.slice(0, -1);
  }

  function ends(a: string, b: string): [Pt, Pt] | null {
    const p = figurePoint(figure, a, answer.placed);
    const q = figurePoint(figure, b, answer.placed);
    if (!p || !q) return null;
    return drawTool?.kind === 'draw' && drawTool.as === 'line'
      ? clipLine(p, q, figure.width, figure.height)
      : [p, q];
  }

  function pickState(id: string): string {
    const chosen = answer.picked.includes(id);
    if (phase === 'success') return chosen ? 'ok' : '';
    if (phase === 'revealed') {
      if (solution?.picked.includes(id)) return chosen ? 'ok' : 'expected';
      return chosen ? 'wrong' : '';
    }
    if (phase === 'review' && chosen) return marks?.[`p:${id}`] === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && chosen && marks?.[`p:${id}`] === 'ok') return 'ok';
    return chosen ? 'chosen' : '';
  }

  function drawnState(i: number): string {
    if (drawTool?.kind === 'draw' && drawTool.help) return 'help';
    if (phase === 'success') return 'ok';
    if (phase === 'revealed' || phase === 'review')
      return marks?.[`d:${i}`] === 'ok' ? 'ok' : 'wrong';
    return 'chosen';
  }

  function placedState(id: string): string {
    if (phase === 'success') return 'ok';
    const mark = marks?.[`l:${id}`];
    if (phase === 'revealed' || phase === 'review') return mark === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && mark === 'ok') return 'ok';
    return 'chosen';
  }

  /** Corrigé : les points de la solution que l'enfant n'a pas bien placés. */
  const expectedPlaced = $derived(
    phase === 'revealed' && solution
      ? solution.placed.filter((p) => marks?.[`l:${p.id}`] !== 'ok')
      : [],
  );
  const expectedDrawn = $derived(phase === 'revealed' && solution ? solution.drawn : []);

  function cross(p: Pt, size = CROSS): string {
    return `M${p.x - size},${p.y - size} L${p.x + size},${p.y + size} M${p.x - size},${p.y + size} L${p.x + size},${p.y - size}`;
  }
</script>

{#if !locked}
  <div class="tools">
    {#if tools.length > 1}
      {#each tools as t (t.kind)}
        <button
          class="tool"
          class:active={mode === t.kind}
          data-testid="tool-{t.kind}"
          onclick={() => {
            mode = t.kind;
            pending = null;
          }}>{TOOL_NAMES[t.kind]}{t.kind === 'place' && nextLabel ? ` ${nextLabel}` : ''}</button
        >
      {/each}
    {/if}
    {#if figure.ruler}
      <button class="tool" class:active={showRuler} onclick={() => (showRuler = !showRuler)}
        >📏 Règle</button
      >
    {/if}
    <button class="tool" disabled={!canUndo} onclick={undo}>↩️ Effacer</button>
  </div>
  <p class="hint">{hint}</p>
{/if}

<svg
  bind:this={svg}
  class="board {mode}"
  class:locked
  viewBox="0 0 {figure.width} {height}"
  style:max-width="{figure.width * PX_PER_CM}px"
  role="application"
  aria-label="Figure"
  data-testid="geometry"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={() => {
    dragging = null;
    rubber = null;
  }}
>
  <rect class="paper" width={figure.width} height={figure.height} rx="0.3" />

  {#each expectedDrawn as [a, b], i (i)}
    {@const line = ends(a, b)}
    {#if line}
      <line class="drawn expected" x1={line[0].x} y1={line[0].y} x2={line[1].x} y2={line[1].y} />
    {/if}
  {/each}
  {#each answer.drawn as [a, b], i (i)}
    {@const line = ends(a, b)}
    {#if line}
      <line
        class="drawn {drawnState(i)}"
        x1={line[0].x}
        y1={line[0].y}
        x2={line[1].x}
        y2={line[1].y}
      />
    {/if}
  {/each}
  {#if rubber}
    {@const from = figurePoint(figure, rubber.from)}
    {#if from}
      <line class="drawn rubber" x1={from.x} y1={from.y} x2={rubber.to.x} y2={rubber.to.y} />
    {/if}
  {/if}

  <FigureLayer {figure} placed={answer.placed} />

  <!-- La règle passe sous les marques de l'enfant, qui restent visibles. -->
  {#if figure.ruler && showRuler}
    <Ruler
      length={rulerLength(figure.width)}
      bind:pose
      snapTo={snapPoints}
      width={figure.width}
      {height}
    />
  {/if}

  {#each pickTargets as id (id)}
    {@const state = pickState(id)}
    {@const point = figurePoint(figure, id)}
    {@const path = figure.paths?.find((p) => p.id === id)}
    {#if state && point}
      <circle class="ring {state}" cx={point.x} cy={point.y} r="0.3" />
    {:else if state && path}
      {@const box = bounds(path.points)}
      <rect
        class="ring {state}"
        x={box.x - 0.45}
        y={box.y - 0.45}
        width={box.w + 0.9}
        height={box.h + (path.caption ? 1.55 : 0.9)}
        rx="0.5"
      />
    {/if}
  {/each}

  {#if pending}
    {@const p = figurePoint(figure, pending)}
    {#if p}<circle class="pending" cx={p.x} cy={p.y} r="0.36" />{/if}
  {/if}

  {#each expectedPlaced as p (p.id)}
    <path class="placed expected" d={cross(p)} />
    <text class="placed-label expected" transform={textAt(p.x, p.y - 0.38)}>{p.id}</text>
  {/each}
  {#each answer.placed as p (p.id)}
    {@const state = placedState(p.id)}
    {@const o = labelOffset('n')}
    <path class="placed {state}" d={cross(p)} data-testid="placed-{p.id}" />
    <text class="placed-label {state}" transform={textAt(p.x + o.dx, p.y + o.dy)}>{p.id}</text>
  {/each}
</svg>

<style>
  .tools {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .tool {
    min-height: 48px;
    padding: 6px 16px;
    border-radius: 14px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .tool.active {
    background: var(--primary);
    border-color: var(--primary-dark);
    color: white;
  }
  .tool:disabled {
    opacity: 0.45;
  }
  .hint {
    margin: -4px 0 0;
    font-size: 0.95rem;
    color: var(--muted, #6b5b7b);
    text-align: center;
  }
  .board {
    width: 100%;
    display: block;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  .board.place {
    cursor: crosshair;
  }
  .board.draw,
  .board.pick {
    cursor: pointer;
  }
  .board.locked {
    cursor: default;
  }
  .paper {
    fill: white;
    stroke: #e3d9ec;
    stroke-width: 0.04;
  }
  .drawn {
    stroke-width: 0.06;
    stroke-linecap: round;
  }
  .drawn.chosen {
    stroke: #1565c0;
  }
  .drawn.help {
    stroke: #64b5f6;
  }
  .drawn.rubber {
    stroke: #1565c0;
    stroke-dasharray: 0.2 0.15;
  }
  .drawn.ok {
    stroke: #2e7d32;
  }
  .drawn.wrong {
    stroke: #c62828;
  }
  .drawn.expected {
    stroke: #ef6c00;
    stroke-width: 0.1;
    opacity: 0.6;
  }
  .ring {
    fill: none;
    stroke-width: 0.07;
  }
  .ring.chosen {
    stroke: #7b1fa2;
  }
  .ring.ok {
    stroke: #2e7d32;
  }
  .ring.wrong {
    stroke: #c62828;
    stroke-dasharray: 0.15 0.1;
  }
  .ring.expected {
    stroke: #ef6c00;
  }
  .pending {
    fill: rgba(21, 101, 192, 0.18);
    stroke: #1565c0;
    stroke-width: 0.05;
  }
  .placed {
    stroke-width: 0.07;
    stroke-linecap: round;
  }
  .placed-label {
    font-size: 10px;
    font-weight: 700;
    text-anchor: middle;
  }
  .placed.chosen {
    stroke: #1565c0;
  }
  .placed-label.chosen {
    fill: #1565c0;
  }
  .placed.ok {
    stroke: #2e7d32;
  }
  .placed-label.ok {
    fill: #2e7d32;
  }
  .placed.wrong {
    stroke: #c62828;
  }
  .placed-label.wrong {
    fill: #c62828;
  }
  .placed.expected {
    stroke: #ef6c00;
  }
  .placed-label.expected {
    fill: #ef6c00;
  }
</style>
