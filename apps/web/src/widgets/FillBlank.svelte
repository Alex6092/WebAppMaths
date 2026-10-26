<script lang="ts">
  import { blankParts } from '@app/core';
  import { untrack } from 'svelte';
  import Keyboard from '../components/Keyboard.svelte';
  import Numpad from '../components/Numpad.svelte';
  import FigureView from '../geometry/FigureView.svelte';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'fill-blank'> = $props();

  const MAX_LENGTH = 40;
  const locked = $derived(isLocked(phase));
  const parts = $derived(blankParts(question.prompt));

  function firstToFill(): number {
    const i = answer.values.findIndex((v, k) => v === '' || marks?.[k] === 'near');
    return i === -1 ? 0 : i;
  }

  let active = $state(untrack(firstToFill));
  const blank = $derived(question.blanks[active]);
  const hasText = $derived(question.blanks.some((b) => b.kind === 'text' && !b.digits));
  const digitsActive = $derived(blank?.kind === 'text' && blank.digits === true);
  const MAX_DIGITS = 4;

  // Au deuxième essai, on se place sur le premier trou à corriger.
  $effect(() => {
    if (phase === 'retry') active = untrack(firstToFill);
  });

  function shown(i: number): string {
    if (phase === 'revealed' && solution) return solution.values[i] ?? '';
    return answer.values[i] ?? '';
  }

  function status(i: number): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return marks?.[i] === 'ok' ? 'ok' : 'expected';
    if (phase === 'retry' && marks?.[i] === 'ok') return 'ok';
    if (phase === 'retry' && marks?.[i] === 'near') return 'near';
    if (phase === 'retry' && marks?.[i] && marks[i] !== 'ok' && answer.values[i] === '')
      return 'was-wrong';
    return '';
  }

  /** Une case courte pour un nombre ou une étiquette courte ; sinon la largeur par défaut. */
  function widthOf(i: number): string | undefined {
    const b = question.blanks[i];
    const chars =
      b?.kind === 'choice'
        ? Math.max(...b.options.map((o) => o.length))
        : b?.kind === 'text'
          ? b.size
          : undefined;
    return chars !== undefined && chars <= 6 ? `${chars + 2.5}ch` : undefined;
  }

  function nextEmpty(from: number): number {
    for (let k = 1; k <= question.blanks.length; k++) {
      const i = (from + k) % question.blanks.length;
      if (answer.values[i] === '') return i;
    }
    return from;
  }

  function choose(option: string) {
    if (locked) return;
    answer.values[active] = option;
    active = nextEmpty(active);
  }

  function type(char: string) {
    if (locked || blank?.kind !== 'text') return;
    if (blank.digits && !/^\d$/.test(char)) return;
    const value = answer.values[active] ?? '';
    if (blank.digits && value.length >= MAX_DIGITS) return;
    if (value.length < MAX_LENGTH)
      answer.values[active] = value + (blank.upper ? char.toUpperCase() : char);
  }

  function erase() {
    if (!locked) answer.values[active] = (answer.values[active] ?? '').slice(0, -1);
  }

  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Tab') {
      active =
        (active + (event.shiftKey ? question.blanks.length - 1 : 1)) % question.blanks.length;
    } else if (blank?.kind === 'text' && event.key.length === 1) type(event.key);
    else if (blank?.kind === 'text' && (event.key === 'Backspace' || event.key === 'Delete'))
      erase();
    else if (blank?.kind === 'choice' && /^[1-9]$/.test(event.key)) {
      const option = blank.options[Number(event.key) - 1];
      if (!option) return;
      choose(option);
    } else return;
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if question.figure}
  <FigureView figure={question.figure} />
{/if}

<!-- Sur une ligne : un retour à la ligne dans le gabarit ajouterait un espace avant « , » ou « . ». -->
<!-- prettier-ignore -->
<p class="prompt">{#each parts as part, p (p)}{#if typeof part === 'number'}<button class="blank {status(part)}" class:active={part === active && !locked} class:text={question.blanks[part]?.kind === 'text'} style:min-width={widthOf(part)} disabled={locked} data-testid="blank-{part}" onclick={() => (active = part)}>{shown(part) || ' '}</button>{:else}{#each part.split('\n') as line, l (l)}{#if l > 0}<br />{/if}{line}{/each}{/if}{/each}</p>

{#if blank?.kind === 'choice' && !locked}
  <div class="options" role="group" aria-label="Étiquettes">
    {#each blank.options as option (option)}
      <button
        class="option"
        class:chosen={answer.values[active] === option}
        onclick={() => choose(option)}>{option}</button
      >
    {/each}
  </div>
{:else if digitsActive && !locked}
  <Numpad ondigit={type} ondelete={erase} />
{:else if hasText && !locked}
  <Keyboard
    disabled={blank?.kind !== 'text'}
    upper={blank?.kind === 'text' && blank.upper === true}
    onkey={type}
    ondelete={erase}
  />
{/if}

<style>
  .prompt {
    background: var(--surface);
    border-radius: 24px;
    padding: 22px 26px;
    box-shadow: var(--shadow);
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 2.3;
    text-align: center;
    max-width: 760px;
  }
  .blank {
    display: inline-block;
    min-width: 120px;
    min-height: 1.6em;
    padding: 0 12px;
    margin: 0 4px;
    vertical-align: middle;
    line-height: 1.5;
    border: 3px dashed var(--primary-soft);
    border-radius: 12px;
    background: #f7f2fb;
    color: #0d47a1;
    font-weight: 700;
  }
  .blank.text {
    border-style: solid;
    border-color: #1565c0;
    background: #e3f2fd;
  }
  .blank.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(245, 127, 23, 0.3);
  }
  .blank.ok {
    background: #a5d6a7;
    border-color: var(--ok);
    border-style: solid;
    color: #1b5e20;
  }
  .blank.near {
    background: #fff3c4;
    border-color: #f9a825;
  }
  .blank.was-wrong {
    border-color: var(--wrong);
    background: var(--wrong-soft);
    animation: shake 0.4s;
  }
  .blank.expected {
    background: #ffe0b2;
    border-color: var(--accent-dark);
    border-style: solid;
    color: var(--accent-dark);
  }
  .options {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 720px;
  }
  .option {
    min-height: 56px;
    padding: 8px 20px;
    border-radius: 16px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--primary-dark);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
  }
  .option.chosen {
    background: var(--primary);
    border-color: var(--primary-dark);
    color: white;
  }
  .option:active {
    transform: translateY(3px);
  }
  @media (max-width: 520px) {
    .prompt {
      font-size: 1.35rem;
      padding: 16px;
    }
    .blank {
      min-width: 90px;
    }
  }
</style>
