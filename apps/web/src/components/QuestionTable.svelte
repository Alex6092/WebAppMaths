<script lang="ts">
  import type { McqTable } from '@app/core';

  let { table }: { table: McqTable } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Le tableau doit pouvoir défiler au clavier.) -->
<div class="table-container" role="region" aria-label={table.caption} tabindex="0">
  <table>
    <caption>{table.caption}</caption>
    <thead>
      <tr>
        <th scope="col">{table.rowHeading}</th>
        {#each table.columns as column, i (i)}
          <th scope="col">
            {column.label}
            {#if column.unit}<span>({column.unit.symbol})</span>{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.rows as row, i (i)}
        <tr>
          <th scope="row">{row.label}</th>
          {#each row.values as value, j (j)}
            <td>{value}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container {
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    break-inside: avoid;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface, white);
    color: var(--text, #25233a);
    font-variant-numeric: tabular-nums;
    font-size: clamp(0.8rem, 2.6vw, 1rem);
  }
  caption {
    margin-block: 0.35em;
    font-weight: 700;
    text-align: start;
  }
  th,
  td {
    padding: 0.35em;
    border: 1px solid #7e7b90;
    text-align: center;
  }
  thead th,
  tbody th {
    background: var(--primary-soft, #f1eef9);
  }
  th:first-child {
    text-align: start;
  }
  th span {
    display: block;
    font-weight: 400;
  }
  @media print {
    .table-container {
      overflow: visible;
    }
    table {
      font-size: 10pt;
    }
    th {
      overflow-wrap: anywhere;
    }
  }
</style>
