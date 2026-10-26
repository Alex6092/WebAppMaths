<script lang="ts">
  import { inlineParts } from '@app/core';

  /** Un texte de leçon avec son **gras**, son *italique* et son __souligné__. */
  let { text }: { text: string } = $props();
</script>

{#each inlineParts(text) as part, i (i)}<span
    class:bold={part.bold}
    class:italic={part.italic}
    class:underline={part.underline}>{part.text}</span
  >{/each}

<style>
  .bold {
    font-weight: 700;
    color: var(--primary);
  }
  .italic {
    font-style: italic;
  }
  .underline {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
