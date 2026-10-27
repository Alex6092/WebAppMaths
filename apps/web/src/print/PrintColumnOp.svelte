<script lang="ts">
  import { columnLayout, type ColumnOpAnswer, type ColumnOpQuestion } from '@app/core';

  /** Une opération à poser sur papier : les cases du résultat (et des retenues) sont à remplir. */
  let {
    question,
    solution = null,
  }: { question: ColumnOpQuestion; solution?: ColumnOpAnswer | null } = $props();

  const layout = $derived(columnLayout(question));
  const sign = $derived(question.op === '+' ? '+' : '−');

  function digitOf(n: number, i: number): string {
    const digits = String(n);
    const offset = i - (layout.cols - digits.length);
    return offset >= 0 ? digits[offset]! : '';
  }
  // Soustraction : pas de ligne de retenues en haut, le corrigé les note comme la leçon
  // (le 1 devant le chiffre du haut, le +1 sous la colonne suivante).
  const subtraction = $derived(question.op === '-');
  const borrowed = (i: number) => !!solution && (solution.carries[i] ?? 0) > 0;
</script>

<table class="column-op">
  <tbody>
    {#if question.showCarries && !subtraction}
      <tr class="carries">
        <td></td>
        {#each { length: layout.cols } as _, i (i)}
          <td class="key"
            >{solution && (solution.carries[i] ?? 0) > 0 ? solution.carries[i] : ''}</td
          >
        {/each}
      </tr>
    {/if}
    {#each question.operands as operand, row (row)}
      <tr>
        <td class="sign">{row === question.operands.length - 1 ? sign : ''}</td>
        {#each { length: layout.cols } as _, i (i)}
          <td class="digit"
            >{#if subtraction && row === 0 && borrowed(i - 1)}<span class="key ten">1</span
              >{/if}{digitOf(operand, i)}{#if subtraction && row === 1 && borrowed(i)}<span
                class="key plus">+1</span
              >{/if}</td
          >
        {/each}
      </tr>
    {/each}
    <tr class="result">
      <td></td>
      {#each layout.expected as expected, i (i)}
        <td class="digit box" class:empty={expected === null}>
          {#if solution && expected !== null}<span class="key">{solution.digits[i]}</span>{/if}
        </td>
      {/each}
    </tr>
  </tbody>
</table>

<style>
  .column-op {
    border-collapse: collapse;
    font-size: 16pt;
    font-variant-numeric: tabular-nums;
  }
  td {
    width: 0.85cm;
    height: 0.85cm;
    padding: 0;
    text-align: center;
    vertical-align: middle;
  }
  .sign {
    width: 0.6cm;
  }
  .carries td {
    height: 0.55cm;
    font-size: 10pt;
  }
  .carries td:not(:first-child) {
    border: 1px dashed #bbb;
  }
  .result td {
    border-top: 2px solid #222;
  }
  .box:not(.empty) {
    border: 1px solid #888;
    border-top: 2px solid #222;
  }
  .key {
    color: #d32f2f;
    font-weight: 700;
  }
  .digit {
    position: relative;
  }
  .ten,
  .plus {
    position: absolute;
    font-size: 9pt;
  }
  .ten {
    left: 0.05cm;
    top: 0;
  }
  .plus {
    right: -0.15cm;
    bottom: 0;
  }
</style>
