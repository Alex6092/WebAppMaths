<script lang="ts">
  import { calendarWeeks, MONTHS, WEEKDAYS } from '@app/core';

  /** La page d'un mois, comme le calendrier de la classe : du lundi au dimanche. */
  let {
    year,
    month,
    marks = [],
    paper = false,
  }: { year: number; month: number; marks?: number[]; paper?: boolean } = $props();

  const weeks = $derived(calendarWeeks(year, month));
</script>

<table class="calendar" class:paper aria-label="Le calendrier de {MONTHS[month - 1]} {year}">
  <caption>{MONTHS[month - 1]} {year}</caption>
  <thead>
    <tr>
      {#each WEEKDAYS as day, d (day)}
        <th scope="col" class:weekend={d >= 5} abbr={day}>{day.slice(0, 3)}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each weeks as week, w (w)}
      <tr>
        {#each week as day, d (d)}
          <td class:weekend={d >= 5} class:empty={day === null}>
            {#if day !== null}<span class:mark={marks.includes(day)}>{day}</span>{/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .calendar {
    border-collapse: collapse;
    background: white;
    border: 3px solid var(--text-soft);
    font-size: 1.25rem;
    text-align: center;
  }
  caption {
    padding: 6px;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-dark);
    text-transform: capitalize;
  }
  th,
  td {
    width: 46px;
    height: 40px;
    border: 1px solid #ccc;
  }
  th {
    font-size: 1rem;
    background: #f1f1f1;
  }
  .weekend {
    background: #fff3e0;
  }
  th.weekend {
    background: #ffe0b2;
  }
  .empty {
    background: #fafafa;
  }
  /* Un jour entouré au feutre rouge. */
  .mark {
    display: inline-block;
    min-width: 1.7em;
    line-height: 1.6;
    border: 3px solid #e53935;
    border-radius: 50%;
  }
  @media (max-width: 520px) {
    .calendar {
      font-size: 1rem;
    }
    th,
    td {
      width: 38px;
      height: 32px;
    }
  }
  .paper {
    border: 1.5px solid #333;
    font-size: 12pt;
  }
  .paper caption {
    padding: 0.1cm;
    font-size: 13pt;
    color: #000;
  }
  .paper th,
  .paper td {
    width: 0.95cm;
    height: 0.7cm;
    border: 1px solid #555;
  }
  .paper th {
    font-size: 10pt;
    background: #eee;
  }
  .paper .weekend,
  .paper th.weekend,
  .paper .empty {
    background: #eee;
  }
  .paper .mark {
    border-width: 2px;
    border-color: #000;
  }
</style>
