<script lang="ts">
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'classify'> = $props();

  const locked = $derived(isLocked(phase));
  /** Étiquette touchée, en attente d'une colonne (« toucher puis toucher »). */
  let held = $state<number | null>(null);
  /** Glisser-déposer au doigt ou à la souris. */
  let drag = $state<{ item: number; x: number; y: number; moved: boolean } | null>(null);

  function placedOf(i: number): string | null {
    if (phase === 'revealed' && solution) return solution.placed[i] ?? null;
    return answer.placed[i] ?? null;
  }

  function status(i: number): string {
    const given = answer.placed[i] ?? null;
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return given === solution?.placed[i] ? 'ok' : 'expected';
    if (phase === 'retry' && marks?.[i] === 'ok' && given !== null) return 'ok';
    if (phase === 'retry' && marks?.[i] === 'wrong' && given === null) return 'was-wrong';
    return '';
  }

  function place(item: number, category: string | null) {
    if (locked) return;
    answer.placed[item] = category;
    held = null;
  }

  function touchItem(i: number) {
    if (locked) return;
    held = held === i ? null : i;
  }

  function touchCategory(id: string) {
    if (held !== null) place(held, id);
  }

  function onpointerdown(event: PointerEvent, item: number) {
    if (locked || event.button !== 0) return;
    drag = { item, x: event.clientX, y: event.clientY, moved: false };
  }

  function onpointermove(event: PointerEvent) {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8;
    drag = { ...drag, x: event.clientX, y: event.clientY, moved };
  }

  function onpointerup(event: PointerEvent) {
    if (!drag) return;
    const { item, moved } = drag;
    drag = null;
    if (!moved) return touchItem(item);
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-category]');
    if (target) place(item, target.dataset.category === 'pool' ? null : target.dataset.category!);
  }
</script>

<svelte:window {onpointermove} {onpointerup} onpointercancel={() => (drag = null)} />

{#snippet chip(i: number)}
  {@const item = question.items[i]!}
  <button
    class="chip {status(i)}"
    class:held={held === i}
    class:dragging={drag?.item === i && drag.moved}
    disabled={locked}
    onpointerdown={(e) => onpointerdown(e, i)}
    onclick={(e) => {
      // Le doigt et la souris passent par onpointerup ; detail = 0 : clic au clavier.
      e.stopPropagation();
      if (e.detail === 0) touchItem(i);
    }}
  >
    {#if item.icon}<span class="icon">{item.icon}</span>{/if}{item.text}
  </button>
{/snippet}

{#if question.layout === 'table'}
  <table class="table">
    <thead>
      <tr>
        <th></th>
        {#each question.categories as c (c.id)}<th style:--c={c.color}>{c.label}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each question.items as item, i (i)}
        <tr class={status(i)}>
          <td class="label"
            >{#if item.icon}<span class="icon">{item.icon}</span>{/if}{item.text}</td
          >
          {#each question.categories as c (c.id)}
            <td>
              <button
                class="box"
                class:checked={placedOf(i) === c.id}
                role="radio"
                aria-checked={placedOf(i) === c.id}
                aria-label="{item.text} : {c.label}"
                disabled={locked}
                onclick={() => place(i, c.id)}>{placedOf(i) === c.id ? '✕' : ''}</button
              >
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <div
    class="pool"
    data-category="pool"
    role="button"
    tabindex="-1"
    aria-label="Étiquettes à ranger"
    onclick={() => held !== null && place(held, null)}
    onkeydown={() => {}}
  >
    {#each question.items as _item, i (i)}
      {#if placedOf(i) === null}{@render chip(i)}{/if}
    {/each}
    {#if question.items.every((_, i) => placedOf(i) !== null)}
      <span class="empty">Toutes les étiquettes sont rangées 👍</span>
    {/if}
  </div>
  <div class="columns">
    {#each question.categories as c (c.id)}
      <div
        class="column"
        class:target={held !== null || drag?.moved}
        style:--c={c.color ?? 'var(--info-soft)'}
        data-category={c.id}
        role="button"
        tabindex="0"
        aria-label="Ranger dans {c.label}"
        onclick={() => touchCategory(c.id)}
        onkeydown={(e) => e.key === 'Enter' && (e.stopPropagation(), touchCategory(c.id))}
      >
        <div class="head">{c.label}</div>
        {#each question.items as _item, i (i)}
          {#if placedOf(i) === c.id}{@render chip(i)}{/if}
        {/each}
      </div>
    {/each}
  </div>
{/if}

{#if drag?.moved}
  <div class="ghost" style:left="{drag.x}px" style:top="{drag.y}px">
    {question.items[drag.item]?.text}
  </div>
{/if}

<style>
  .pool {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    min-height: 72px;
    width: 100%;
    max-width: 760px;
    padding: 12px;
    border-radius: 18px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .empty {
    align-self: center;
    color: var(--text-soft);
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
    width: 100%;
    max-width: 760px;
  }
  .column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    min-height: 160px;
    padding: 10px;
    border-radius: 18px;
    background: var(--c);
    border: 3px solid rgba(0, 0, 0, 0.12);
  }
  .column.target {
    border-style: dashed;
    border-color: var(--primary);
  }
  .head {
    text-align: center;
    font-weight: 700;
    font-size: 1.2rem;
    text-transform: uppercase;
  }
  .chip {
    padding: 10px 16px;
    min-height: 52px;
    border-radius: 14px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
    touch-action: none;
  }
  .chip.held {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(245, 127, 23, 0.35);
    transform: translateY(-2px);
  }
  .chip.dragging {
    opacity: 0.35;
  }
  .ghost {
    position: fixed;
    transform: translate(-50%, -50%);
    pointer-events: none;
    padding: 10px 16px;
    border-radius: 14px;
    background: white;
    border: 3px solid var(--accent);
    font-size: 1.25rem;
    font-weight: 700;
    box-shadow: var(--shadow);
    z-index: 100;
  }
  .table {
    border-collapse: separate;
    border-spacing: 0;
    background: var(--surface);
    border-radius: 18px;
    box-shadow: var(--shadow);
    overflow: hidden;
    width: 100%;
    max-width: 760px;
  }
  th,
  td {
    padding: 8px;
    border-bottom: 1px solid #e0d7ee;
    text-align: center;
  }
  th {
    background: var(--c, var(--info-soft));
    font-size: 0.95rem;
    text-transform: uppercase;
  }
  td.label {
    text-align: left;
    font-size: 1.25rem;
    font-weight: 700;
  }
  .box {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--wrong);
  }
  .box.checked {
    border-color: var(--primary-dark);
  }
  .ok {
    box-shadow: 0 0 0 3px var(--ok);
  }
  tr.ok td {
    background: #e8f5e9;
    box-shadow: none;
  }
  .expected {
    outline: 3px dashed var(--accent-dark);
    outline-offset: 2px;
  }
  tr.expected td {
    background: #fff3e0;
    outline: none;
  }
  .was-wrong {
    animation: shake 0.4s;
    border-color: var(--wrong);
  }
  tr.was-wrong td.label {
    color: var(--wrong);
  }
  .icon {
    margin-right: 6px;
  }
  @media (max-width: 520px) {
    td.label {
      font-size: 1rem;
    }
    .box {
      width: 40px;
      height: 40px;
    }
  }
</style>
