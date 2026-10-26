<script lang="ts">
  import type { Picture } from '@app/core';
  import Coin from './Coin.svelte';
  import Dial from './Dial.svelte';

  /** Une image d'énoncé : une horloge, ou des pièces et des billets. Avec paper, en centimètres. */
  let {
    picture,
    paper = false,
    small = false,
  }: { picture: Picture; paper?: boolean; small?: boolean } = $props();

  const clockSize = $derived(paper ? (small ? '3.2cm' : '4cm') : small ? '150px' : '220px');
</script>

{#if picture.kind === 'clock'}
  {@const r = picture.minuteLabels ? 62 : 51}
  <svg
    class="clock"
    width={clockSize}
    height={clockSize}
    viewBox="{-r} {-r} {2 * r} {2 * r}"
    role="img"
    aria-label="Une horloge"
  >
    <Dial minutes={picture.minutes} minuteLabels={picture.minuteLabels} />
  </svg>
{:else}
  <div class="money" class:paper role="img" aria-label="Des pièces et des billets">
    {#each picture.values as value, i (i)}<Coin {value} {paper} {small} />{/each}
  </div>
{/if}

<style>
  .clock {
    display: block;
    flex: none;
  }
  .money {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    max-width: 620px;
  }
  .money.paper {
    justify-content: flex-start;
    gap: 0.2cm;
    max-width: none;
  }
</style>
