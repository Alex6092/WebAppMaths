<script lang="ts">
  import { VIOLIN_STRINGS } from '@app/core';

  /** Le manche du violon vu de face : les quatre cordes, de la plus grave à la plus aiguë. */
  let { paper = false }: { paper?: boolean } = $props();

  const scale = $derived(paper ? 0.03 : 1.6);
  const unit = $derived(paper ? 'cm' : 'px');
</script>

<svg
  class="violin"
  width="{140 * scale}{unit}"
  height="{150 * scale}{unit}"
  viewBox="0 0 140 150"
  role="img"
  aria-label="Les cordes du violon : sol, ré, la, mi"
>
  <path class="neck" d="M30 30 L110 30 L100 148 L40 148 Z" />
  {#each VIOLIN_STRINGS as string, i (string.name)}
    {@const x = 42 + i * 19}
    <line
      class="string"
      x1={x}
      x2={x + (i - 1.5) * 3}
      y1="30"
      y2="148"
      style:stroke-width={2.6 - i * 0.5}
    />
    <text {x} y="18">{string.name}</text>
  {/each}
</svg>

<style>
  .violin {
    display: block;
    flex: none;
  }
  .neck {
    fill: #3e2723;
  }
  .string {
    stroke: #e0e0e0;
  }
  text {
    font-size: 15px;
    font-weight: 700;
    text-anchor: middle;
    fill: var(--primary-dark, #4a148c);
  }
</style>
