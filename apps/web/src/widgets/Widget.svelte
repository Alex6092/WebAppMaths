<script lang="ts">
  import type { Mark, PluginQuestion } from '@app/core';
  import Classify from './Classify.svelte';
  import ColumnOp from './ColumnOp.svelte';
  import FillBlank from './FillBlank.svelte';
  import Geometry from './Geometry.svelte';
  import Mcq from './Mcq.svelte';
  import NumberInput from './NumberInput.svelte';
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
</script>

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
{/if}
