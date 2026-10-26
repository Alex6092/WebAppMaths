<script lang="ts">
  import type { MoneyAnswer, MoneyQuestion } from '@app/core';
  import Coin from '../pictures/Coin.svelte';

  /** Payer sur papier : le prix, puis les pièces et les billets à entourer (en rouge au corrigé). */
  let { question, solution = null }: { question: MoneyQuestion; solution?: MoneyAnswer | null } =
    $props();
</script>

<p class="prompt">
  {#if question.icon}<span class="icon">{question.icon}</span>{/if}
  <span>{question.prompt}</span>
</p>
<div class="purse">
  {#each question.purse as value, i (i)}
    <span class="coin-item" class:bill={value >= 500} class:key={solution?.picked.includes(i)}>
      <Coin {value} paper />
    </span>
  {/each}
</div>

<style>
  .prompt {
    display: flex;
    align-items: center;
    gap: 0.2cm;
    margin: 0.1cm 0;
    font-size: 14pt;
  }
  .icon {
    font-size: 18pt;
  }
  .purse {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2cm 0.25cm;
  }
  .coin-item {
    padding: 0.08cm;
    border: 2px solid transparent;
    border-radius: 50%;
  }
  .coin-item.bill {
    border-radius: 0.3cm;
  }
  .coin-item.key {
    border-color: #d32f2f;
  }
</style>
