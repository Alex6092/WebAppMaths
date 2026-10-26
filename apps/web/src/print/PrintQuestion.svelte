<script lang="ts">
  import type { AnswerOf, PluginQuestion, Question } from '@app/core';
  import PaperFigure from './PaperFigure.svelte';
  import PrintClassify from './PrintClassify.svelte';
  import PrintColumnOp from './PrintColumnOp.svelte';
  import PrintFillBlank from './PrintFillBlank.svelte';
  import PrintMcq from './PrintMcq.svelte';
  import PrintNumber from './PrintNumber.svelte';
  import PrintWords from './PrintWords.svelte';

  /** Une question sur papier ; avec solution, son corrigé (en rouge). */
  let { question, solution = null }: { question: PluginQuestion; solution?: unknown } = $props();

  // Chaque widget reçoit la réponse attendue de son propre type.
  const key = <Q extends Question>(_q: Q) => solution as AnswerOf<Q> | null;
</script>

{#if question.widget === 'column-op'}
  <PrintColumnOp {question} solution={key(question)} />
{:else if question.widget === 'number-input'}
  <PrintNumber {question} solution={key(question)} />
{:else if question.widget === 'mcq'}
  <PrintMcq {question} solution={key(question)} />
{:else if question.widget === 'word-select'}
  <PrintWords {question} solution={key(question)} />
{:else if question.widget === 'classify'}
  <PrintClassify {question} solution={key(question)} />
{:else if question.widget === 'fill-blank'}
  <PrintFillBlank {question} solution={key(question)} />
{:else if question.widget === 'geometry'}
  <PaperFigure figure={question.figure} tools={question.tools} solution={key(question)} />
{/if}
