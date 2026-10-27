<script lang="ts">
  import type { MatchAnswer, MatchQuestion } from '@app/core';
  import MatchGrid from '../widgets/MatchGrid.svelte';

  /** Relier sur papier : les cartes et leurs points ; au corrigé, les traits en rouge. */
  let { question, solution = null }: { question: MatchQuestion; solution?: MatchAnswer | null } =
    $props();

  const links = $derived(solution?.links ?? question.columns.slice(1).map(() => []));
</script>

<MatchGrid columns={question.columns} {links} paper>
  {#snippet card(_c, _i, text, icon)}
    <div class="card">
      {#if icon}<span class="icon">{icon}</span>{/if}<span>{text}</span>
    </div>
  {/snippet}
</MatchGrid>

<style>
  .card {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.15cm;
    padding: 0.12cm 0.2cm;
    border: 1px solid #333;
    border-radius: 0.15cm;
    font-size: 12pt;
    line-height: 1.3;
    text-align: center;
  }
  .icon {
    font-size: 16pt;
  }
</style>
