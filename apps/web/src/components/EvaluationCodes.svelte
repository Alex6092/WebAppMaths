<script lang="ts">
  import { EVALUATION_CODES, type EvaluationCode } from '@app/core';

  /** Les trois codes de l'école, celui obtenu entouré (comme sur les évaluations). */
  let { code }: { code: EvaluationCode } = $props();
</script>

<span class="codes" aria-label="Code : {code}">
  {#each EVALUATION_CODES as c (c)}
    <span class="code {c}" class:on={c === code}>{c}</span>
  {/each}
</span>

<style>
  .codes {
    display: inline-flex;
    gap: 4px;
  }
  .code {
    min-width: 40px;
    padding: 2px 6px;
    border-radius: 999px;
    border: 2px solid transparent;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #b0aab8;
  }
  .code.on {
    border-color: currentColor;
  }
  .code.on.A {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .code.on.ECA {
    background: #bbdefb;
    color: #0d47a1;
  }
  .code.on.NA {
    background: #ffe0b2;
    color: #b45309;
  }
  @media print {
    .code {
      color: #999;
    }
    .code.on {
      color: #000;
      background: none;
    }
  }
</style>
