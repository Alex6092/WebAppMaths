<script lang="ts">
  import { blankParts, type FillBlankAnswer, type FillBlankQuestion } from '@app/core';
  import PictureView from '../pictures/PictureView.svelte';
  import PaperFigure from './PaperFigure.svelte';

  /**
   * Un texte à trous sur papier : une ligne à écrire par trou ; pour un trou à choix, les mots
   * possibles sont rappelés entre parenthèses.
   */
  let {
    question,
    solution = null,
  }: { question: FillBlankQuestion; solution?: FillBlankAnswer | null } = $props();

  const lines = $derived(question.prompt.split('\n').map(blankParts));
  /** Tous les trous proposent les mêmes mots (ranger des nombres) : on les donne une fois. */
  const shared = $derived.by(() => {
    const [first, ...rest] = question.blanks;
    if (first?.kind !== 'choice' || rest.length === 0) return null;
    const key = [...first.options].sort().join('|');
    return rest.every((b) => b.kind === 'choice' && [...b.options].sort().join('|') === key)
      ? first.options
      : null;
  });
</script>

{#if question.figure}<PaperFigure figure={question.figure} />{/if}
{#if question.picture}<PictureView picture={question.picture} paper />{/if}
{#if shared}
  <p class="shared">
    {#each shared as option (option)}<span>{option}</span>{/each}
  </p>
{/if}
<div class="text">
  {#each lines as parts, l (l)}
    <p>
      {#each parts as part, i (i)}
        {#if typeof part === 'string'}{part}{:else}
          {@const blank = question.blanks[part]}
          <span
            class="blank"
            style:min-width="{blank?.kind === 'text'
              ? Math.max(2, (blank.size ?? 6) * 0.45)
              : 2.6}cm"
            >{#if solution}<span class="key">{solution.values[part]}</span>{/if}</span
          >{#if blank?.kind === 'choice' && !shared}<span class="options"
              >({blank.options.join(' / ')})</span
            >{/if}
        {/if}
      {/each}
    </p>
  {/each}
</div>

<style>
  .text {
    font-size: 14pt;
    line-height: 2;
  }
  .text p {
    margin: 0;
  }
  .blank {
    display: inline-block;
    border-bottom: 1px solid #333;
    text-align: center;
    margin: 0 0.1cm;
    line-height: 1.4;
  }
  .shared {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2cm;
    margin: 0 0 0.1cm;
  }
  .shared span {
    border: 1px dashed #777;
    border-radius: 4px;
    padding: 0.05cm 0.25cm;
  }
  .options {
    color: #666;
    font-size: 10.5pt;
    margin-right: 0.1cm;
  }
  .key {
    color: #d32f2f;
    font-weight: 700;
  }
</style>
