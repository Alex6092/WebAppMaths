<script lang="ts">
  import Coin from '../pictures/Coin.svelte';
  import { isLocked, type WidgetProps } from './types';

  /** Payer : l'enfant entoure (touche) les pièces et les billets qu'il donne ; un autre toucher les rend. */
  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'money'> = $props();

  const locked = $derived(isLocked(phase));
  const shown = $derived(phase === 'revealed' && solution ? solution.picked : answer.picked);
  const state = $derived(
    phase === 'success'
      ? 'ok'
      : phase === 'revealed'
        ? 'expected'
        : phase === 'review'
          ? marks?.total === 'ok'
            ? 'ok'
            : 'wrong'
          : '',
  );

  function toggle(index: number) {
    if (locked) return;
    answer.picked = answer.picked.includes(index)
      ? answer.picked.filter((i) => i !== index)
      : [...answer.picked, index];
  }
</script>

<div class="prompt">
  {#if question.icon}<span class="icon">{question.icon}</span>{/if}
  <span>{question.prompt}</span>
</div>

<div class="purse" data-testid="purse">
  {#each question.purse as value, i (i)}
    <button
      class="money-item {state}"
      class:bill={value >= 500}
      class:picked={shown.includes(i)}
      aria-pressed={shown.includes(i)}
      disabled={locked}
      onclick={() => toggle(i)}
    >
      <Coin {value} />
    </button>
  {/each}
</div>

<style>
  .prompt {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    border-radius: 24px;
    padding: 14px 28px;
    box-shadow: var(--shadow);
    font-size: 1.9rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .icon {
    font-size: 1.5em;
  }
  .purse {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    max-width: 720px;
    padding: 16px;
    border-radius: 24px;
    background: #fff8e1;
    box-shadow: var(--shadow);
  }
  .money-item {
    padding: 6px;
    border: 4px solid transparent;
    border-radius: 50%;
    background: none;
    transition: transform 0.12s;
  }
  .money-item.bill {
    border-radius: 16px;
  }
  .money-item:active:not(:disabled) {
    transform: scale(0.95);
  }
  /* Entouré, comme au crayon sur la fiche. */
  .money-item.picked {
    border-color: var(--primary);
    background: rgba(123, 31, 162, 0.08);
  }
  .money-item.picked.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .money-item.picked.wrong {
    border-color: var(--wrong);
  }
  .money-item.picked.expected {
    border-color: var(--accent-dark);
    background: #ffe0b2;
  }
  .money-item:disabled {
    cursor: default;
  }
</style>
