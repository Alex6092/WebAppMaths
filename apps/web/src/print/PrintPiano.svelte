<script lang="ts">
  import type { PianoAnswer, PianoQuestion } from '@app/core';
  import Keyboard from '../pictures/Keyboard.svelte';
  import PictureView from '../pictures/PictureView.svelte';

  /** Le piano sur papier : la partition, et un clavier où colorier les touches (en rouge au corrigé). */
  let { question, solution = null }: { question: PianoQuestion; solution?: PianoAnswer | null } =
    $props();

  const colors = $derived(
    Object.fromEntries((solution?.keys ?? []).map((k) => [k, '#ef9a9a'])) as Record<number, string>,
  );
  const numbers = $derived.by(() => {
    const out: Record<number, string> = {};
    if (!solution || question.count < 2) return out;
    solution.keys.forEach((k, i) => (out[k] = out[k] ? `${out[k]},${i + 1}` : String(i + 1)));
    return out;
  });
</script>

<div class="piano">
  {#if question.picture}<PictureView picture={question.picture} paper />{/if}
  <Keyboard
    from={question.from}
    to={question.to}
    labels={question.labels}
    {colors}
    {numbers}
    paper
  />
</div>

<style>
  .piano {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4cm;
  }
</style>
