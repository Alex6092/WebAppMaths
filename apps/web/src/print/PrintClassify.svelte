<script lang="ts">
  import type { ClassifyAnswer, ClassifyQuestion } from '@app/core';

  /**
   * Ranger sur papier. En tableau : une croix par ligne dans la bonne colonne. En colonnes : les
   * étiquettes sont à recopier sous le bon titre.
   */
  let {
    question,
    solution = null,
  }: { question: ClassifyQuestion; solution?: ClassifyAnswer | null } = $props();

  const lines = $derived(Math.ceil(question.items.length / question.categories.length) + 1);
  const itemsIn = (id: string) =>
    question.items.filter((_, i) => solution?.placed[i] === id).map((item) => item.text);
</script>

{#if question.layout === 'table'}
  <table class="grid">
    <thead>
      <tr>
        <th></th>
        {#each question.categories as c (c.id)}<th>{c.label}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each question.items as item, i (i)}
        <tr>
          <th class="row-label">{item.icon ?? ''} {item.text}</th>
          {#each question.categories as c (c.id)}
            <td class="cell"
              >{#if solution?.placed[i] === c.id}<span class="key">✗</span>{/if}</td
            >
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p class="labels">
    {#each question.items as item, i (i)}
      <span class="label">{item.icon ?? ''} {item.text}</span>
    {/each}
  </p>
  <table class="grid columns">
    <thead>
      <tr>
        {#each question.categories as c (c.id)}
          <th style:border-bottom-color={c.color ?? '#555'}>{c.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each { length: lines } as _, row (row)}
        <tr>
          {#each question.categories as c (c.id)}
            <td class="line"><span class="key">{itemsIn(c.id)[row] ?? ''}</span></td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .grid {
    border-collapse: collapse;
    font-size: 12pt;
    margin: 0.1cm 0;
  }
  th,
  td {
    border: 1px solid #888;
    padding: 0.12cm 0.25cm;
  }
  thead th {
    background: #f1f1f1;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .row-label {
    text-align: left;
    font-weight: 400;
  }
  .cell {
    width: 1.6cm;
    text-align: center;
  }
  .columns {
    width: 100%;
    table-layout: fixed;
  }
  .columns thead th {
    border-bottom-width: 3px;
  }
  .line {
    height: 0.8cm;
    border-left: 1px solid #888;
    border-right: 1px solid #888;
    border-top: none;
    border-bottom: 1px dotted #aaa;
  }
  .labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2cm;
    margin: 0 0 0.2cm;
  }
  .label {
    border: 1px dashed #777;
    border-radius: 4px;
    padding: 0.08cm 0.25cm;
    font-size: 12pt;
  }
  .key {
    color: #d32f2f;
    font-weight: 700;
  }
</style>
