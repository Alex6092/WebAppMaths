<script lang="ts">
  import type { NumberInputAnswer, NumberInputQuestion } from '@app/core';
  import PictureView from '../pictures/PictureView.svelte';
  import PaperFigure from './PaperFigure.svelte';

  /** Une réponse en nombre : une case à remplir dans l'énoncé (« 4 × 3 = ▢ »). */
  let {
    question,
    solution = null,
  }: { question: NumberInputQuestion; solution?: NumberInputAnswer | null } = $props();

  const [before = '', after = ''] = $derived(question.prompt.split('{?}'));
</script>

{#if question.figure}<PaperFigure figure={question.figure} />{/if}
{#if question.picture}<PictureView picture={question.picture} paper />{/if}
<p class="prompt">
  {#if before.trim()}<span>{before.trim()}</span>{/if}
  <span class="box"
    >{#if solution}<span class="key">{solution.value}</span>{/if}</span
  >
  {#if after.trim()}<span>{after.trim()}</span>{/if}
  {#if question.unit}<span>{question.unit}</span>{/if}
</p>

<style>
  .prompt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2cm;
    font-size: 14pt;
    margin: 0.15cm 0;
  }
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.8cm;
    height: 0.9cm;
    border: 1px solid #555;
    border-radius: 3px;
  }
  .key {
    color: #d32f2f;
    font-weight: 700;
  }
</style>
