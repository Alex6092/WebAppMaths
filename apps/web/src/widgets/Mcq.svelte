<script lang="ts">
  import { isLocked, type WidgetProps } from './types';

  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'mcq'> = $props();

  const locked = $derived(isLocked(phase));

  function toggle(id: string) {
    if (locked) return;
    if (!question.multiple) answer.selected = [id];
    else if (answer.selected.includes(id))
      answer.selected = answer.selected.filter((s) => s !== id);
    else answer.selected = [...answer.selected, id];
  }

  function choiceState(id: string): string {
    const chosen = answer.selected.includes(id);
    if (phase === 'success') return chosen ? 'ok' : '';
    if (phase === 'revealed') {
      if (solution?.selected.includes(id)) return 'expected';
      return chosen ? 'wrong' : '';
    }
    if (phase === 'retry' && marks?.[id] === 'wrong' && !chosen) return 'was-wrong';
    return chosen ? 'chosen' : '';
  }

  // Touches du clavier : le signe lui-même (<, >, =) ou le numéro du choix.
  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    const byLabel = question.choices.find((c) => c.label === event.key);
    const byIndex = /^[1-9]$/.test(event.key) ? question.choices[Number(event.key) - 1] : undefined;
    const choice = byLabel ?? byIndex;
    if (!choice) return;
    toggle(choice.id);
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if question.prompt}
  <div class="prompt">{question.prompt}</div>
{/if}

<div class="choices {question.layout ?? 'grid'}" role={question.multiple ? 'group' : 'radiogroup'}>
  {#each question.choices as choice (choice.id)}
    <button
      class="choice {choiceState(choice.id)}"
      role={question.multiple ? 'checkbox' : 'radio'}
      aria-checked={answer.selected.includes(choice.id)}
      disabled={locked}
      onclick={() => toggle(choice.id)}
    >
      {#if choice.icon}<span class="icon">{choice.icon}</span>{/if}
      <span>{choice.label}</span>
    </button>
  {/each}
</div>

<style>
  .prompt {
    background: var(--surface);
    border-radius: 24px;
    padding: 24px 32px;
    box-shadow: var(--shadow);
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--primary-dark);
    text-align: center;
    white-space: pre-wrap;
  }
  .choices {
    display: grid;
    gap: 12px;
    width: 100%;
    max-width: 560px;
  }
  .choices.row {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }
  .choices.grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  .choices.list {
    grid-template-columns: 1fr;
  }
  .choice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 72px;
    padding: 12px;
    border-radius: 18px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-dark);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
    transition: transform 0.12s;
  }
  .choices.list .choice,
  .choices.grid .choice {
    font-size: 1.3rem;
  }
  .choice:active:not(:disabled) {
    transform: translateY(3px);
  }
  .choice.chosen {
    background: var(--primary);
    border-color: var(--primary-dark);
    color: white;
  }
  .choice.ok {
    background: #a5d6a7;
    border-color: var(--ok);
    color: #1b5e20;
  }
  .choice.wrong {
    background: #ef9a9a;
    border-color: var(--wrong);
    color: var(--wrong);
  }
  .choice.was-wrong {
    border-color: var(--wrong);
    animation: shake 0.4s;
  }
  .choice.expected {
    background: #ffe0b2;
    border-color: var(--accent-dark);
    color: var(--accent-dark);
  }
  .icon {
    font-size: 1.6em;
  }
</style>
