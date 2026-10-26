<script lang="ts">
  import { isLocked, type WidgetProps } from './types';

  /**
   * Remettre dans l'ordre : l'enfant touche les étiquettes de la réserve, qui se posent une à
   * une sur la ligne ; toucher une étiquette posée la renvoie dans la réserve (avec celles d'après).
   */
  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'order'> = $props();

  const locked = $derived(isLocked(phase));
  /** L'ordre montré : la bonne réponse quand elle est révélée, sinon celui de l'enfant. */
  const shown = $derived(phase === 'revealed' && solution ? solution.order : answer.order);
  const pool = $derived(question.tiles.map((_, i) => i).filter((i) => !answer.order.includes(i)));

  function place(index: number) {
    if (!locked) answer.order = [...answer.order, index];
  }

  function takeBack(position: number) {
    if (!locked) answer.order = answer.order.slice(0, position);
  }

  function status(position: number): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return marks?.[position] === 'ok' ? 'ok' : 'fixed';
    if (phase === 'review')
      return marks?.[position] === 'ok' ? 'ok' : marks?.[position] === 'wrong' ? 'wrong' : '';
    // Au deuxième essai, le début juste reste en vert ; la suite est à refaire.
    if (phase === 'retry' && marks?.[position] === 'ok') return 'ok';
    return '';
  }

  // Retour arrière : la dernière étiquette posée revient dans la réserve.
  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key !== 'Backspace' || answer.order.length === 0) return;
    event.preventDefault();
    takeBack(answer.order.length - 1);
  }
</script>

<svelte:window {onkeydown} />

<div class="line" class:empty={shown.length === 0} data-testid="order-line">
  {#each shown as index, position (position)}
    {@const tile = question.tiles[index]}
    {#if tile}
      <button
        class="tile placed {status(position)}"
        class:glue={tile.glue}
        disabled={locked}
        onclick={() => takeBack(position)}>{tile.text}</button
      >
    {/if}
  {:else}
    <span class="hint">Touche les étiquettes dans le bon ordre.</span>
  {/each}
</div>

{#if !locked && pool.length > 0}
  <div class="pool">
    {#each pool as index (index)}
      <button class="tile" onclick={() => place(index)}>{question.tiles[index]?.text}</button>
    {/each}
  </div>
{/if}

<style>
  .line {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 10px 8px;
    min-height: 84px;
    width: 100%;
    max-width: 760px;
    padding: 14px 18px;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
    border-bottom: 4px solid var(--primary-soft);
  }
  .hint {
    color: var(--text-soft);
    font-size: 1.05rem;
  }
  .pool {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 760px;
  }
  .tile {
    min-height: 56px;
    min-width: 48px;
    padding: 6px 16px;
    border-radius: 14px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
  }
  .tile:not(:disabled):hover {
    background: var(--info-soft);
  }
  .tile.placed {
    border-color: var(--primary);
  }
  /* Le point se pose collé au dernier mot. */
  .tile.glue {
    margin-left: -4px;
    min-width: 40px;
    padding: 6px 10px;
  }
  .tile:disabled {
    cursor: default;
  }
  .ok {
    border-color: var(--ok);
    box-shadow: 0 0 0 3px var(--ok);
  }
  .fixed {
    border-color: var(--accent-dark);
    box-shadow: 0 0 0 3px var(--accent-dark);
  }
  .wrong {
    border-color: var(--wrong);
    box-shadow: 0 0 0 3px var(--wrong);
  }
  @media (max-width: 520px) {
    .tile {
      font-size: 1.2rem;
      min-height: 48px;
      padding: 4px 12px;
    }
  }
</style>
