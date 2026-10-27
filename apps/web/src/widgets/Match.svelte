<script lang="ts">
  import { linkKey } from '@app/core';
  import MatchGrid from './MatchGrid.svelte';
  import { isLocked, type WidgetProps } from './types';

  /**
   * Relier : l'enfant touche une carte puis une carte de la colonne d'à côté, et un trait les
   * relie ; il peut aussi tirer le trait du doigt. Relier à nouveau les deux mêmes cartes efface
   * le trait.
   */
  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'match'> = $props();

  const locked = $derived(isLocked(phase));
  /** Les traits montrés : la bonne réponse quand elle est révélée, sinon ceux de l'enfant. */
  const shown = $derived(phase === 'revealed' && solution ? solution.links : answer.links);

  let selected = $state<{ c: number; i: number } | null>(null);
  $effect(() => {
    if (locked) selected = null;
  });

  function link(a: { c: number; i: number }, b: { c: number; i: number }) {
    const [from, to] = a.c < b.c ? [a, b] : [b, a];
    const row = answer.links[from.c];
    if (!row) return;
    if (row[from.i] === to.i) {
      row[from.i] = null;
      return;
    }
    // Une carte ne reçoit qu'un trait : celui d'avant s'efface.
    row.forEach((j, k) => {
      if (j === to.i) row[k] = null;
    });
    row[from.i] = to.i;
  }

  function tap(c: number, i: number) {
    if (locked) return;
    if (selected && Math.abs(selected.c - c) === 1) {
      link(selected, { c, i });
      selected = null;
    } else if (selected?.c === c && selected.i === i) selected = null;
    else selected = { c, i };
  }

  function lineState(c: number, i: number): string {
    const mark = marks?.[linkKey(c, i)];
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return mark === 'ok' ? 'ok' : 'fixed';
    if (phase === 'review') return mark === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && mark === 'ok') return 'ok';
    return '';
  }

  // Tirer un trait du doigt : de la carte de départ jusqu'à une carte de la colonne d'à côté.
  let grid: HTMLDivElement | undefined = $state();
  interface Drag {
    c: number;
    i: number;
    /** Bords gauche et droit de la carte de départ, et son milieu en hauteur. */
    left: number;
    right: number;
    y0: number;
    /** Le doigt, au départ puis maintenant. */
    px: number;
    py: number;
    x: number;
    y: number;
    moved: boolean;
  }
  let drag = $state<Drag | null>(null);
  /** Après un trait tiré, le « clic » qui suit le lâcher ne compte pas. */
  let skipClick = false;

  function cardAt(x: number, y: number): { c: number; i: number } | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-card]');
    if (!el || !grid?.contains(el)) return null;
    const [c = 0, i = 0] = (el.dataset.card ?? '').split(':').map(Number);
    return { c, i };
  }

  function onpointerdown(event: PointerEvent) {
    skipClick = false;
    if (locked || !grid) return;
    const card = cardAt(event.clientX, event.clientY);
    const el = card && grid.querySelector(`[data-card="${card.c}:${card.i}"]`);
    if (!card || !el) return;
    const box = grid.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    drag = {
      ...card,
      left: r.left - box.left,
      right: r.right - box.left,
      y0: r.top + r.height / 2 - box.top,
      px: x,
      py: y,
      x,
      y,
      moved: false,
    };
  }

  function onpointermove(event: PointerEvent) {
    if (!drag || !grid) return;
    const box = grid.getBoundingClientRect();
    drag.x = event.clientX - box.left;
    drag.y = event.clientY - box.top;
    if (Math.hypot(drag.x - drag.px, drag.y - drag.py) > 12) drag.moved = true;
  }

  function onpointerup(event: PointerEvent) {
    if (!drag) return;
    const from = drag;
    drag = null;
    if (!from.moved) return;
    skipClick = true;
    const to = cardAt(event.clientX, event.clientY);
    if (to && Math.abs(to.c - from.c) === 1) {
      link(from, to);
      selected = null;
    }
  }

  function onclick(c: number, i: number) {
    if (skipClick) skipClick = false;
    else tap(c, i);
  }

  /** Le trait part du bord de la carte qui est du côté où l'on tire. */
  const dragX = $derived(
    drag ? (drag.x > (drag.left + drag.right) / 2 ? drag.right : drag.left) : 0,
  );
</script>

<svelte:window onpointerup={() => (drag = null)} />

<div
  class="match"
  class:locked
  bind:this={grid}
  role="group"
  aria-label="Cartes à relier"
  data-testid="match"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={() => (drag = null)}
>
  <MatchGrid columns={question.columns} links={shown} {lineState}>
    {#snippet card(c, i, text, icon)}
      <button
        class="card"
        class:selected={selected?.c === c && selected.i === i}
        class:linked={c < question.columns.length - 1
          ? shown[c]?.[i] != null
          : shown[c - 1]?.includes(i)}
        data-card="{c}:{i}"
        disabled={locked}
        onclick={() => onclick(c, i)}
      >
        {#if icon}<span class="icon">{icon}</span>{/if}<span>{text}</span>
      </button>
    {/snippet}
  </MatchGrid>
  {#if drag?.moved}
    <svg class="drag" aria-hidden="true">
      <line x1={dragX} y1={drag.y0} x2={drag.x} y2={drag.y} />
    </svg>
  {/if}
</div>

{#if !locked}
  <p class="hint">Touche une carte, puis celle qui va avec dans la colonne d’à côté.</p>
{/if}

<style>
  .match {
    position: relative;
    width: 100%;
    max-width: 900px;
  }
  .card {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 16px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
    /* On peut tirer le trait du doigt sans faire défiler la page. */
    touch-action: none;
  }
  .card:not(:disabled):hover {
    background: var(--info-soft);
  }
  .card.linked {
    border-color: var(--primary);
  }
  .card.selected {
    border-color: var(--accent-dark);
    background: var(--accent-light);
    transform: translateY(-2px);
  }
  .card:disabled {
    cursor: default;
  }
  .icon {
    font-size: 1.8rem;
  }
  .drag {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .drag line {
    stroke: var(--accent-dark);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 8 8;
  }
  .hint {
    margin: 0;
    color: var(--text-soft);
    font-size: 1rem;
    text-align: center;
  }
  @media (max-width: 520px) {
    .card {
      font-size: 0.95rem;
      padding: 6px 6px;
    }
  }
</style>
