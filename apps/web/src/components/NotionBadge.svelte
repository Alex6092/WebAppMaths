<script lang="ts">
  import type { NotionMastery } from '@app/core';
  import { STATUS_LABELS } from '../lib/notions';

  /** Où en est l'enfant sur une notion : une pastille colorée et quelques mots. */
  let { mastery }: { mastery: NotionMastery } = $props();
</script>

<span class="badge {mastery.status}" title="{mastery.mastery} %">
  {#if mastery.status === 'A'}⭐{/if}
  {STATUS_LABELS[mastery.status]}
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
</style>
