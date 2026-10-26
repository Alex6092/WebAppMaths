<script lang="ts">
  import { columnLayout, type ColumnOpQuestion } from '@app/core';

  /**
   * Une opération posée et calculée, comme au tableau. Les retenues sont en rouge : en haut pour
   * l'addition ; pour la soustraction, le 1 devant le chiffre du haut et le +1 sous la colonne suivante.
   */
  let { op, operands }: { op: '+' | '-'; operands: number[] } = $props();

  const question = $derived<ColumnOpQuestion>({
    widget: 'column-op',
    instruction: '',
    op,
    operands,
    showCarries: true,
  });
  const layout = $derived(columnLayout(question));

  function digitOf(n: number, i: number): string {
    const digits = String(n);
    const offset = i - (layout.cols - digits.length);
    return offset >= 0 ? digits[offset]! : '';
  }
  // Le cahier n'a pas la colonne vide de gauche, réservée à la dernière retenue.
  const columns = $derived(
    Array.from({ length: layout.cols }, (_, i) => i).filter(
      (i) => layout.expected[i] !== null || operands.some((n) => digitOf(n, i) !== ''),
    ),
  );
  /** Pour la soustraction : la colonne i a « 10 de plus » en haut si sa voisine de gauche reçoit une retenue. */
  const tenAdded = (i: number) => (layout.carries[i - 1] ?? 0) > 0;
</script>

<div
  class="operation"
  role="img"
  aria-label="{operands.join(op === '+' ? ' + ' : ' − ')} = {layout.result}"
>
  {#if op === '+'}
    <div class="row">
      <span class="sign"></span>
      {#each columns as i (i)}
        <span class="cell carry">{layout.carries[i] ? layout.carries[i] : ''}</span>
      {/each}
    </div>
  {/if}
  {#each operands as operand, row (row)}
    <div class="row">
      <span class="sign">{row === operands.length - 1 ? (op === '+' ? '+' : '−') : ''}</span>
      {#each columns as i (i)}
        <span class="cell"
          >{#if op === '-' && row === 0 && tenAdded(i)}<small class="red ten">1</small
            >{/if}{digitOf(operand, i)}{#if op === '-' && row === 1 && layout.carries[i]}<small
              class="red plus">+1</small
            >{/if}</span
        >
      {/each}
    </div>
  {/each}
  <div class="line"></div>
  <div class="row">
    <span class="sign"></span>
    {#each columns as i (i)}
      <span class="cell result">{layout.expected[i] ?? ''}</span>
    {/each}
  </div>
</div>

<style>
  .operation {
    align-self: center;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 10px 18px;
    border-radius: 16px;
    background: var(--surface);
    border: 2px solid var(--primary-soft);
    font-size: 1.6rem;
    font-weight: 700;
  }
  .row {
    display: flex;
  }
  .sign {
    width: 1.2em;
    text-align: center;
    color: var(--primary);
  }
  .cell {
    width: 1.5em;
    text-align: center;
    position: relative;
  }
  .carry {
    font-size: 0.65em;
    height: 1.2em;
    color: #d32f2f;
  }
  .red {
    position: absolute;
    color: #d32f2f;
    font-size: 0.55em;
  }
  .ten {
    left: 0;
    top: 0.1em;
  }
  .plus {
    right: -0.3em;
    bottom: -0.2em;
  }
  .line {
    align-self: stretch;
    border-top: 3px solid var(--text);
    margin: 2px 0;
  }
  .result {
    color: var(--primary);
  }
</style>
