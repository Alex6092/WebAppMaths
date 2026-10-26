<script lang="ts">
  import { isSelectable } from '@app/core';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'word-select'> = $props();

  const locked = $derived(isLocked(phase));
  let active = $state(0);
  const activeColor = $derived(question.colors[active] ?? question.colors[0]!);
  const colorOf = (id: string | null) => question.colors.find((c) => c.id === id)?.color;

  /** Couleur affichée : la bonne réponse quand elle est révélée, sinon celle de l'enfant. */
  function shown(i: number): string | null {
    if (phase === 'revealed' && solution) return solution.picks[i] ?? null;
    return answer.picks[i] ?? null;
  }

  function status(i: number): string {
    const given = answer.picks[i] ?? null;
    if (phase === 'revealed') {
      if (given !== null && given !== solution?.picks[i]) return 'wrong';
      return solution?.picks[i] ? (given === solution.picks[i] ? 'ok' : 'expected') : '';
    }
    if (phase === 'success') return given ? 'ok' : '';
    if (phase === 'review') {
      if (marks?.[i] === 'wrong') return given !== null ? 'wrong' : 'was-wrong';
      return given !== null ? 'ok' : '';
    }
    if (phase === 'retry' && marks?.[i] === 'ok' && given !== null) return 'ok';
    if (phase === 'retry' && marks?.[i] === 'wrong' && given === null) return 'was-wrong';
    return '';
  }

  function toggle(i: number) {
    if (locked || !isSelectable(question, i)) return;
    answer.picks[i] = answer.picks[i] === activeColor.id ? null : activeColor.id;
  }

  // Deux mots voisins entourés : on les relie dans une même bulle.
  const joined = (i: number) =>
    question.mark === 'circle' && i > 0 && shown(i) !== null && shown(i - 1) !== null;

  // Touches 1, 2, 3 : choisir la couleur.
  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    const index = Number(event.key) - 1;
    if (question.colors.length > 1 && index >= 0 && index < question.colors.length) {
      active = index;
      event.preventDefault();
    }
  }
</script>

<svelte:window {onkeydown} />

{#if question.colors.length > 1}
  <div class="palette" role="radiogroup" aria-label="Couleurs">
    {#each question.colors as c, i (c.id)}
      <button
        class="swatch"
        class:active={i === active}
        role="radio"
        aria-checked={i === active}
        disabled={locked}
        style:--c={c.color}
        onclick={() => (active = i)}
      >
        <span class="dot"></span>{c.label}
      </button>
    {/each}
  </div>
{/if}

{#if question.layout === 'grid'}
  <div class="grid">
    {#each question.tokens as token, i (i)}
      <button
        class="cell {status(i)}"
        style:--c={colorOf(shown(i))}
        class:picked={shown(i) !== null}
        disabled={locked}
        aria-pressed={answer.picks[i] !== null}
        onclick={() => toggle(i)}>{token.text}</button
      >
    {/each}
  </div>
{:else}
  <p class="sentence mark-{question.mark}">
    {#each question.tokens as token, i (i)}
      {#if i > 0 && !token.glue}<span
          class="gap"
          class:joined={joined(i)}
          style:--c={colorOf(shown(i))}
        ></span>{/if}{#if isSelectable(question, i)}<button
          class="word {status(i)}"
          class:picked={shown(i) !== null}
          class:join-left={joined(i)}
          class:join-right={question.mark === 'circle' &&
            shown(i) !== null &&
            shown(i + 1) !== null &&
            i + 1 < question.tokens.length}
          style:--c={colorOf(shown(i))}
          disabled={locked}
          aria-pressed={answer.picks[i] !== null}
          onclick={() => toggle(i)}>{token.text}</button
        >{:else}<span class="punct">{token.text}</span>{/if}
    {/each}
  </p>
{/if}

<style>
  .palette {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 14px;
    border: 3px solid transparent;
    background: white;
    font-weight: 700;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
  }
  .swatch.active {
    border-color: var(--primary-dark);
    transform: translateY(-2px);
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--c);
    border: 2px solid rgba(0, 0, 0, 0.25);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
    width: 100%;
    max-width: 720px;
  }
  .cell {
    min-height: 60px;
    padding: 8px;
    border-radius: 14px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
  }
  .cell.picked {
    background: var(--c);
    /* Pas de color-mix : la tablette d'Océane a Chrome 109 (Windows 8.1). */
    border-color: rgba(0, 0, 0, 0.3);
  }
  /* En flex, les blancs du gabarit ne comptent pas : seuls les .gap font les espaces. */
  .sentence {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    row-gap: 14px;
    background: var(--surface);
    border-radius: 24px;
    padding: 24px 28px;
    box-shadow: var(--shadow);
    font-size: 1.9rem;
    line-height: 1.5;
    max-width: 760px;
  }
  /* L'espace entre deux mots vient surtout de la marge intérieure des boutons. */
  .gap {
    width: 0.12em;
    align-self: stretch;
  }
  .word {
    border: 3px solid transparent;
    background: none;
    padding: 0 5px;
    border-radius: 10px;
    font-weight: 700;
    color: var(--text);
  }
  .word:not(:disabled):hover {
    background: var(--info-soft);
  }
  .mark-underline .word.picked {
    text-decoration: underline;
    text-decoration-color: var(--c);
    text-decoration-thickness: 4px;
    text-underline-offset: 8px;
  }
  .mark-color .word.picked {
    background: var(--c);
  }
  .mark-circle .word.picked {
    border-color: var(--c);
    border-radius: 999px;
  }
  .mark-circle .word.join-left {
    border-left-color: transparent;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .mark-circle .word.join-right {
    border-right-color: transparent;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .gap.joined {
    border-top: 3px solid var(--c);
    border-bottom: 3px solid var(--c);
  }
  .punct {
    font-weight: 700;
    margin-left: -6px;
  }
  /* Correction */
  .ok {
    box-shadow: 0 0 0 3px var(--ok);
  }
  .expected {
    outline: 3px dashed var(--accent-dark);
    outline-offset: 2px;
  }
  .wrong {
    box-shadow: 0 0 0 3px var(--wrong);
    text-decoration: line-through;
  }
  .was-wrong {
    animation: shake 0.4s;
    box-shadow: 0 0 0 3px var(--wrong);
  }
  @media (max-width: 520px) {
    .sentence {
      font-size: 1.45rem;
      padding: 16px;
    }
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .cell {
      font-size: 1.1rem;
    }
  }
</style>
