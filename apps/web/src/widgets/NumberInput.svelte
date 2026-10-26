<script lang="ts">
  import Numpad from '../components/Numpad.svelte';
  import FigureView from '../geometry/FigureView.svelte';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
    onvalidate,
  }: WidgetProps<'number-input'> & { onvalidate: () => void } = $props();

  const locked = $derived(isLocked(phase));
  const [before = '', after = ''] = $derived(question.prompt.split('{?}'));
  const maxLength = $derived(question.maxLength ?? 6);
  const shown = $derived(phase === 'revealed' && solution ? solution.value : answer.value);
  const state = $derived(
    phase === 'success'
      ? 'ok'
      : phase === 'revealed'
        ? 'fixed'
        : marks?.value === 'wrong' && answer.value === ''
          ? 'wrong'
          : '',
  );

  function typeDigit(digit: string) {
    if (!locked && answer.value.length < maxLength) answer.value += digit;
  }

  function erase() {
    if (!locked) answer.value = answer.value.slice(0, -1);
  }

  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) typeDigit(event.key);
    else if (event.key === 'Backspace' || event.key === 'Delete') erase();
    else return;
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if question.figure}
  <FigureView figure={question.figure} />
{/if}

<div class="prompt">
  {#if before.trim()}<span>{before.trim()}</span>{/if}
  <span class="box {state}" data-testid="number-box">{shown || '?'}</span>
  {#if after.trim()}<span>{after.trim()}</span>{/if}
  {#if question.unit}<span class="unit">{question.unit}</span>{/if}
</div>

<Numpad disabled={locked} ondigit={typeDigit} ondelete={erase} {onvalidate} />

<style>
  .prompt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 24px;
    padding: 24px;
    box-shadow: var(--shadow);
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--primary-dark);
    text-align: center;
  }
  .box {
    min-width: 90px;
    height: 70px;
    padding: 0 14px;
    border: 3px solid #1565c0;
    border-radius: 14px;
    background: #e3f2fd;
    color: #0d47a1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .box.ok {
    background: #a5d6a7;
    border-color: var(--ok);
    color: #1b5e20;
  }
  .box.wrong {
    background: #ef9a9a;
    border-color: var(--wrong);
    animation: shake 0.4s;
  }
  .box.fixed {
    background: #ffe0b2;
    border-color: var(--accent-dark);
    color: var(--accent-dark);
  }
  .unit {
    font-size: 1.6rem;
  }
  @media (max-width: 420px) {
    .prompt {
      font-size: 1.7rem;
      padding: 18px;
    }
  }
</style>
