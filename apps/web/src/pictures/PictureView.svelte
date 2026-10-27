<script lang="ts">
  import type { Picture } from '@app/core';
  import Coin from './Coin.svelte';
  import Dial from './Dial.svelte';

  /** Une image d'énoncé : une horloge, des pièces et des billets, ou des objets à compter. Avec paper, en centimètres. */
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
{:else if picture.kind === 'icons'}
  <div class="icons" class:paper role="img" aria-label="Des objets à compter">
    {#each picture.icons as icon, i (i)}<span>{icon}</span>{/each}
  </div>
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
  /* Les objets d'un panier, d'un sac… rangés dans un cadre, comme sur les fiches. */
  .icons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
    max-width: min(340px, 100%);
    padding: 12px 18px;
    border: 3px solid var(--text-soft);
    border-radius: 24px;
    background: white;
    font-size: 2.6rem;
    line-height: 1.2;
    text-align: center;
  }
  .icons span {
    width: 52px;
  }
  .icons.paper {
    width: fit-content;
    max-width: 7cm;
    padding: 0.2cm 0.3cm;
    border: 1.5px solid #333;
    border-radius: 0.5cm;
    font-size: 22pt;
  }
  .icons.paper span {
    width: 1.1cm;
  }
  .money.paper {
    justify-content: flex-start;
    gap: 0.2cm;
    max-width: none;
  }
</style>
