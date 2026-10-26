<script lang="ts">
  import { isMastered, type NotionMastery, type NotionReview } from '@app/core';
  import { STATUS_LABELS } from '../lib/notions';

  /**
   * Où en est l'enfant sur une notion : une pastille colorée et quelques mots. Une notion
   * acquise et réussie en révision espacée est « Maîtrisée ».
   */
  let { mastery, review }: { mastery: NotionMastery; review?: NotionReview | undefined } = $props();
  const mastered = $derived(isMastered(review, mastery.status === 'A'));
</script>

<span class="badge {mastered ? 'M' : mastery.status}" title="{mastery.mastery} %">
  {#if mastered}🌟 Maîtrisé
  {:else}
    {#if mastery.status === 'A'}⭐{/if}
    {STATUS_LABELS[mastery.status]}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 10px;
    padding: 2px 10px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .new {
    background: #eceff1;
    color: #546e7a;
  }
  .NA {
    background: #ffe0b2;
    color: #b45309;
  }
  .ECA {
    background: #bbdefb;
    color: #0d47a1;
  }
  .A {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .M {
    background: #fff3c4;
    color: #7a5a00;
    box-shadow: inset 0 0 0 2px #ffd54f;
  }
</style>
