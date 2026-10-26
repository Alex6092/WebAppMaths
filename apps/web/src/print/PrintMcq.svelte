<script lang="ts">
  import type { McqAnswer, McqQuestion } from '@app/core';
  import PictureView from '../pictures/PictureView.svelte';
  import PaperFigure from './PaperFigure.svelte';

  /**
   * Un choix sur papier : une case à cocher par réponse. Avec « {?} » dans l'énoncé (un signe
   * entre deux nombres), la case est dans la phrase et les choix sont rappelés à côté.
   */
  let { question, solution = null }: { question: McqQuestion; solution?: McqAnswer | null } =
    $props();

  const slotted = $derived(question.prompt?.includes('{?}') ?? false);
  const [before = '', after = ''] = $derived(question.prompt?.split('{?}') ?? []);
  const chosen = (id: string) => solution?.selected.includes(id) ?? false;
  const slotLabel = $derived(
    question.choices.find((c) => c.id === solution?.selected[0])?.label ?? '',
  );
</script>

{#if question.figure}<PaperFigure figure={question.figure} />{/if}
{#if question.picture}<PictureView picture={question.picture} paper />{/if}
{#if slotted}
  <p class="prompt">
    <span>{before.trim()}</span>
    <span class="slot"
      >{#if solution}<span class="key">{slotLabel}</span>{/if}</span
    >
    <span>{after.trim()}</span>
    <span class="hint">({question.choices.map((c) => c.label).join(' ou ')})</span>
  </p>
{:else}
  {#if question.prompt}<p class="prompt">{question.prompt}</p>{/if}
  <ul class="choices {question.layout ?? 'row'}">
    {#each question.choices as choice (choice.id)}
      <li>
        <span class="check" class:key-box={chosen(choice.id)}>{chosen(choice.id) ? '✗' : ''}</span>
        {#if choice.icon}<span class="icon">{choice.icon}</span>{/if}
        {#if choice.picture}<PictureView picture={choice.picture} paper small />{/if}
        <span>{choice.label}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .prompt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2cm;
    font-size: 14pt;
    margin: 0.15cm 0;
  }
  .slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.9cm;
    height: 0.9cm;
    border: 1px solid #555;
    border-radius: 3px;
  }
  .hint {
    color: #666;
    font-size: 11pt;
  }
  .choices {
    list-style: none;
    padding: 0;
    margin: 0.1cm 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25cm 0.8cm;
    font-size: 13pt;
  }
  .choices.list {
    flex-direction: column;
  }
  .choices li {
    display: flex;
    align-items: center;
    gap: 0.2cm;
  }
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.55cm;
    height: 0.55cm;
    border: 1px solid #444;
    border-radius: 2px;
    font-weight: 700;
  }
  .key,
  .key-box {
    color: #d32f2f;
    font-weight: 700;
  }
  .key-box {
    border-color: #d32f2f;
  }
  .icon {
    font-size: 16pt;
  }
</style>
