<script lang="ts">
  import { columnLayout, PLACE_NAMES } from '@app/core';
  import { untrack } from 'svelte';
  import Numpad from '../components/Numpad.svelte';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
    onvalidate,
  }: WidgetProps<'column-op'> & { onvalidate: () => void } = $props();

  const layout = $derived(columnLayout(question));
  const locked = $derived(isLocked(phase));
  const maxCarry = $derived(question.op === '+' ? Math.max(1, question.operands.length - 1) : 1);
  const sign = $derived(question.op === '+' ? '+' : '−');

  const fillable = (i: number) => layout.expected[i] !== null;

  /** Première case vide en partant de la droite (les unités) : on calcule comme sur le cahier. */
  function rightmostEmpty(): number {
    for (let i = layout.cols - 1; i >= 0; i--) if (fillable(i) && answer.digits[i] === '') return i;
    return -1;
  }

  let selected = $state(untrack(rightmostEmpty));

  // Au deuxième essai, on se place sur la première case à corriger (une fois, pas à chaque frappe).
  $effect(() => {
    if (phase === 'retry') selected = untrack(rightmostEmpty);
  });

  function typeDigit(digit: string) {
    if (locked) return;
    if (selected < 0) selected = rightmostEmpty();
    if (selected < 0) return;
    answer.digits[selected] = digit;
    let next = selected - 1;
    while (next >= 0 && !fillable(next)) next--;
    selected = next;
  }

  function erase() {
    if (locked) return;
    if (selected >= 0 && answer.digits[selected] !== '') {
      answer.digits[selected] = '';
      return;
    }
    // Retour arrière : on efface le chiffre tapé juste avant (à droite).
    for (let i = selected + 1; i < layout.cols; i++) {
      if (fillable(i) && answer.digits[i] !== '') {
        answer.digits[i] = '';
        selected = i;
        return;
      }
    }
  }

  function toggleCarry(i: number) {
    if (locked) return;
    answer.carries[i] = ((answer.carries[i] ?? 0) + 1) % (maxCarry + 1);
  }

  function move(step: number) {
    let i = selected < 0 ? layout.cols : selected;
    do i += step;
    while (i >= 0 && i < layout.cols && !fillable(i));
    if (i >= 0 && i < layout.cols) selected = i;
  }

  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) typeDigit(event.key);
    else if (event.key === 'Backspace' || event.key === 'Delete') erase();
    else if (event.key === 'ArrowLeft') move(-1);
    else if (event.key === 'ArrowRight') move(1);
    else return;
    event.preventDefault();
  }

  function digitOf(n: number, i: number): string {
    const digits = String(n);
    const offset = i - (layout.cols - digits.length);
    return offset >= 0 ? digits[offset]! : '';
  }

  function placeName(i: number): string {
    return PLACE_NAMES[layout.cols - 1 - i] ?? 'chiffres';
  }

  function cellState(i: number): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return marks?.[i] === 'ok' ? 'ok' : 'fixed';
    if (phase === 'review')
      return marks?.[i] === 'wrong' ? 'wrong' : marks?.[i] === 'ok' ? 'ok' : '';
    if (marks?.[i] === 'wrong' && answer.digits[i] === '') return 'wrong';
    return i === selected ? 'selected' : '';
  }

  const shownDigits = $derived(phase === 'revealed' && solution ? solution.digits : answer.digits);
  const shownCarries = $derived(
    phase === 'revealed' && solution ? solution.carries : answer.carries,
  );
</script>

<svelte:window {onkeydown} />

<div class="grid" data-operands={question.operands.join(',')} data-op={question.op}>
  {#if question.showCarries}
    <div class="row">
      <span class="sign"></span>
      {#each { length: layout.cols } as _, i (i)}
        {@const hint =
          phase === 'retry' &&
          (solution?.carries[i] ?? 0) > 0 &&
          answer.carries[i] !== solution?.carries[i]}
        <button
          class="carry"
          class:has={(shownCarries[i] ?? 0) > 0}
          class:hint
          disabled={locked}
          onclick={() => toggleCarry(i)}
          aria-label="Retenue des {placeName(i)}"
        >
          {(shownCarries[i] ?? 0) > 0 ? shownCarries[i] : ''}
        </button>
      {/each}
    </div>
  {/if}

  {#each question.operands as operand, row (row)}
    <div class="row">
      <span class="sign">{row === question.operands.length - 1 ? sign : ''}</span>
      {#each { length: layout.cols } as _, i (i)}
        <span class="digit" class:second={row > 0}>{digitOf(operand, i)}</span>
      {/each}
    </div>
  {/each}

  <div class="line"></div>

  <div class="row">
    <span class="sign"></span>
    {#each { length: layout.cols } as _, i (i)}
      {#if fillable(i)}
        <button
          class="answer {cellState(i)}"
          disabled={locked}
          onclick={() => (selected = i)}
          aria-label="Chiffre des {placeName(i)}"
          data-testid="answer-cell"
        >
          {shownDigits[i]}
        </button>
      {:else}
        <span class="answer empty"></span>
      {/if}
    {/each}
  </div>
</div>

<Numpad disabled={locked} ondigit={typeDigit} ondelete={erase} {onvalidate} />

<style>
  .grid {
    --cell: 52px;
    background: var(--surface);
    border-radius: 24px;
    padding: 20px 24px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .row {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .sign {
    width: 36px;
    text-align: center;
    font-size: 2.1rem;
    font-weight: 700;
    color: var(--primary);
  }
  .digit,
  .answer,
  .carry {
    width: var(--cell);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    border-radius: 10px;
  }
  .digit {
    height: 58px;
    font-size: 2rem;
    color: var(--primary-dark);
  }
  .digit:not(:empty) {
    background: #fce4ec;
    border: 3px solid var(--primary-soft);
  }
  .digit.second:not(:empty) {
    background: #e3f2fd;
    border-color: #90caf9;
    color: #0d47a1;
  }
  .carry {
    height: 28px;
    border: 2px dashed #ffb74d;
    background: #fff8e1;
    color: var(--accent-dark);
    font-size: 1rem;
  }
  .carry.has {
    background: #ff8f00;
    border-style: solid;
    color: white;
  }
  .carry.hint {
    background: #ffe082;
    border-color: var(--accent);
  }
  .line {
    height: 4px;
    width: 100%;
    border-radius: 2px;
    margin: 6px 0;
    background: linear-gradient(90deg, var(--primary), #1565c0);
  }
  .answer {
    height: 60px;
    font-size: 2rem;
    border: 3px solid #1565c0;
    background: #e3f2fd;
    color: #0d47a1;
    transition: transform 0.1s;
  }
  .answer.empty {
    border-color: transparent;
    background: transparent;
  }
  .answer.selected {
    background: #1565c0;
    color: white;
    box-shadow: 0 0 0 3px #90caf9;
  }
  .answer.ok {
    background: #a5d6a7;
    border-color: var(--ok);
    color: #1b5e20;
  }
  .answer.wrong {
    background: #ef9a9a;
    border-color: var(--wrong);
    animation: shake 0.4s;
  }
  .answer.fixed {
    background: #ffe0b2;
    border-color: var(--accent-dark);
    color: var(--accent-dark);
  }
  @media (max-width: 380px) {
    .grid {
      --cell: 44px;
      padding: 16px;
    }
  }
</style>
