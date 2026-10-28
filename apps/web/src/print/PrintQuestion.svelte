<script lang="ts">
  import type { AnswerOf, PluginQuestion, Question } from '@app/core';
  import PaperFigure from './PaperFigure.svelte';
  import PrintClassify from './PrintClassify.svelte';
  import PrintClock from './PrintClock.svelte';
  import PrintColumnOp from './PrintColumnOp.svelte';
  import PrintComprehension from './PrintComprehension.svelte';
  import PrintFillBlank from './PrintFillBlank.svelte';
  import PrintMatch from './PrintMatch.svelte';
  import PrintMcq from './PrintMcq.svelte';
  import PrintMoney from './PrintMoney.svelte';
  import PrintNumber from './PrintNumber.svelte';
  import PrintOrder from './PrintOrder.svelte';
  import PrintWords from './PrintWords.svelte';

  /** Une question sur papier ; avec solution, son corrigé (en rouge). */
  let { question, solution = null }: { question: PluginQuestion; solution?: unknown } = $props();

  // Chaque widget reçoit la réponse attendue de son propre type.
  const key = <Q extends Question>(_q: Q) => solution as AnswerOf<Q> | null;
</script>

{#if question.text}<p class="text">{question.text}</p>{/if}
<!-- Une dictée : l'adulte lit ce qui est écrit sur le corrigé. -->
{#if question.listen && solution}<p class="listen">
    🔊 à lire{question.listenLang?.startsWith('en') ? ' en anglais' : ''} : « {question.listen} »
  </p>{/if}

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
{:else if question.widget === 'order'}
  <PrintOrder {question} solution={key(question)} />
{:else if question.widget === 'clock'}
  <PrintClock {question} solution={key(question)} />
{:else if question.widget === 'money'}
  <PrintMoney {question} solution={key(question)} />
{:else if question.widget === 'match'}
  <PrintMatch {question} solution={key(question)} />
{:else if question.widget === 'comprehension'}
  <PrintComprehension {question} solution={key(question)} />
{/if}

<style>
  .text {
    margin: 0 0 0.1cm;
    font-size: 13pt;
    line-height: 1.4;
    white-space: pre-line;
  }
  .listen {
    margin: 0 0 0.1cm;
    font-size: 11pt;
    color: #d32f2f;
  }
</style>
