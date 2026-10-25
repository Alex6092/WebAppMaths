<script lang="ts">
  import type { Mark, PluginQuestion } from '@app/core';
  import ColumnOp from './ColumnOp.svelte';
  import Mcq from './Mcq.svelte';
  import NumberInput from './NumberInput.svelte';
  import type { Phase } from './types';

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
</script>

{#if question.widget === 'column-op'}
  <ColumnOp {question} bind:answer {phase} {marks} {solution} {onvalidate} />
{:else if question.widget === 'number-input'}
  <NumberInput {question} bind:answer {phase} {marks} {solution} {onvalidate} />
{:else if question.widget === 'mcq'}
  <Mcq {question} bind:answer {phase} {marks} {solution} />
{/if}
