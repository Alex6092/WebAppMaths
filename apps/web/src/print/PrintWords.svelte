<script lang="ts">
  import type { WordSelectAnswer, WordSelectQuestion } from '@app/core';

  /**
   * Des mots à colorier, entourer ou souligner au crayon. Avec plusieurs couleurs, la légende
   * rappelle laquelle va avec quoi. Le corrigé marque les mots attendus.
   */
  let {
    question,
    solution = null,
  }: { question: WordSelectQuestion; solution?: WordSelectAnswer | null } = $props();

  const space = (i: number) =>
    i > 0 && !question.tokens[i]!.glue && question.layout === 'sentence' ? ' ' : '';
  const colorOf = (i: number) => {
    const id = solution?.picks[i];
    return id ? (question.colors.find((c) => c.id === id)?.color ?? '#d32f2f') : null;
  };
</script>

{#if question.colors.length > 1}
  <p class="legend">
    {#each question.colors as c (c.id)}
      <span><span class="swatch" style:background={c.color}></span>{c.label}</span>
    {/each}
  </p>
{/if}
<p class="words {question.layout} {question.mark}">
  <!-- Pas d'espace entre les balises : la ponctuation reste collée au mot. -->
  {#each question.tokens as token, i (i)}<span
      >{space(i)}<span
        class="word"
        class:marked={colorOf(i) !== null}
        style:--key={colorOf(i) ?? 'transparent'}>{token.text}</span
      ></span
    >{/each}
</p>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2cm 0.6cm;
    font-size: 11pt;
    margin: 0 0 0.15cm;
  }
  .legend > span {
    display: inline-flex;
    align-items: center;
    gap: 0.15cm;
  }
  .swatch {
    display: inline-block;
    width: 0.4cm;
    height: 0.4cm;
    border: 1px solid #555;
    border-radius: 2px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .words {
    font-size: 15pt;
    line-height: 2.1;
    margin: 0.1cm 0;
  }
  .words.grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25cm;
    line-height: 1.4;
  }
  .grid .word {
    display: inline-block;
    padding: 0.15cm 0.3cm;
    border: 1px solid #888;
    border-radius: 3px;
  }
  .word.marked {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  /* Comme un surligneur : le mot reste lisible. */
  .color .word.marked {
    box-shadow: inset 0 -0.5em 0 var(--key);
  }
  /* Le corrigé se lit aussi en noir et blanc. */
  .grid.color .word.marked {
    border: 2px solid #d32f2f;
  }
  .circle .word.marked {
    border: 2px solid #d32f2f;
    border-radius: 999px;
    padding: 0 0.12cm;
  }
  .underline .word.marked {
    text-decoration: underline;
    text-decoration-color: #d32f2f;
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
  }
</style>
