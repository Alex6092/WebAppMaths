<script lang="ts">
  import { orderText, type OrderAnswer, type OrderQuestion } from '@app/core';

  /** Remettre dans l'ordre sur papier : les étiquettes, puis une ligne pour tout recopier. */
  let { question, solution = null }: { question: OrderQuestion; solution?: OrderAnswer | null } =
    $props();
</script>

<p class="tiles">
  {#each question.tiles as tile, i (i)}<span>{tile.text}</span>{/each}
</p>
<p class="line">
  {#if solution}<span class="key">{orderText(question, solution.order)}</span>{/if}
</p>

<style>
  .tiles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2cm;
    margin: 0 0 0.15cm;
  }
  .tiles span {
    border: 1px dashed #777;
    border-radius: 4px;
    padding: 0.08cm 0.25cm;
    font-size: 13pt;
  }
  .line {
    min-height: 0.9cm;
    border-bottom: 1px solid #333;
    margin: 0;
    font-size: 14pt;
    display: flex;
    align-items: flex-end;
  }
  .key {
    color: #d32f2f;
    font-weight: 700;
  }
</style>
