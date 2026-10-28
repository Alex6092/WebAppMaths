<script lang="ts">
  import type { Mark, PluginQuestion } from '@app/core';
  import { untrack } from 'svelte';
  import { speak, ttsAvailable } from '../lib/tts';
  import Classify from './Classify.svelte';
  import Clock from './Clock.svelte';
  import ColumnOp from './ColumnOp.svelte';
  import Comprehension from './Comprehension.svelte';
  import FillBlank from './FillBlank.svelte';
  import Geometry from './Geometry.svelte';
  import Match from './Match.svelte';
  import Mcq from './Mcq.svelte';
  import Money from './Money.svelte';
  import NumberInput from './NumberInput.svelte';
  import Order from './Order.svelte';
  import type { Phase } from './types';
  import WordSelect from './WordSelect.svelte';

  /** Choisit le composant d'affichage selon le widget de la question. */
  interface Props {
    question: PluginQuestion;
    answer: any;
    phase: Phase;
    marks: Record<string, Mark> | null;
    solution: any;
    onvalidate: () => void;
  }
  let { question, answer = $bindable(), phase, marks, solution, onvalidate }: Props = $props();

  // La dictée se lit toute seule quand la question arrive (pas quand le parent la revoit).
  // Un mot d'anglais se dit un peu moins lentement qu'une dictée.
  const lang = $derived(question.listenLang ?? 'fr-FR');
  const rate = $derived(question.listenLang ? 0.8 : 0.7);
  const hear = () => speak(question.listen ?? '', lang, rate);
  $effect(() => {
    if (question.listen && untrack(() => phase) === 'answering') untrack(hear);
  });
</script>

{#if question.listen && ttsAvailable()}
  <button class="listen" data-testid="listen" onclick={hear}>
    <span aria-hidden="true">🔊</span> Écoute
  </button>
{/if}

{#if question.text}
  <p class="text">{question.text}</p>
{/if}

{#if question.widget === 'column-op'}
  <ColumnOp {question} bind:answer {phase} {marks} {solution} {onvalidate} />
{:else if question.widget === 'number-input'}
  <NumberInput {question} bind:answer {phase} {marks} {solution} {onvalidate} />
{:else if question.widget === 'mcq'}
  <Mcq {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'word-select'}
  <WordSelect {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'classify'}
  <Classify {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'fill-blank'}
  <FillBlank {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'geometry'}
  <Geometry {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'order'}
  <Order {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'clock'}
  <Clock {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'money'}
  <Money {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'match'}
  <Match {question} bind:answer {phase} {marks} {solution} />
{:else if question.widget === 'comprehension'}
  <Comprehension {question} bind:answer {phase} {marks} {solution} />
{/if}

<style>
  /* Le gros bouton de la dictée : on réécoute autant qu'on veut. */
  .listen {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 32px;
    border-radius: 24px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--primary-dark);
    box-shadow: var(--shadow);
  }
  .listen span {
    font-size: 2.2rem;
  }
  .listen:active {
    transform: translateY(2px);
  }
  /* L'énoncé d'un problème : à lire tranquillement, plus petit que la question. */
  .text {
    margin: 0;
    max-width: 760px;
    padding: 16px 24px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
    font-size: 1.45rem;
    line-height: 1.5;
    white-space: pre-line;
  }
  @media (max-width: 520px) {
    .text {
      font-size: 1.15rem;
      padding: 12px 16px;
    }
  }
</style>
