<script lang="ts">
  /** La courbe d'une mélodie : un point par note, plus haut quand la note est plus aiguë. */
  let {
    steps,
    paper = false,
    small = false,
  }: { steps: readonly number[]; paper?: boolean; small?: boolean } = $props();

  const low = $derived(Math.min(...steps));
  const high = $derived(Math.max(...steps));
  const points = $derived(steps.map((s, i) => [20 + i * 30, 10 + (high - s) * 9] as const));
  const width = $derived(steps.length * 30 + 10);
  const height = $derived((high - low) * 9 + 20);
  const scale = $derived(paper ? 0.03 : small ? 1.1 : 1.6);
  const unit = $derived(paper ? 'cm' : 'px');
</script>

<svg
  class="contour"
  width="{width * scale}{unit}"
  height="{height * scale}{unit}"
  viewBox="0 0 {width} {height}"
  role="img"
  aria-label="La courbe d'une mélodie"
>
  <polyline points={points.map((p) => p.join(',')).join(' ')} />
  {#each points as [x, y], i (i)}<circle cx={x} cy={y} r="5" />{/each}
</svg>

<style>
  .contour {
    display: block;
    flex: none;
  }
  polyline {
    fill: none;
    stroke: var(--primary-soft, #ce93d8);
    stroke-width: 3;
    stroke-linejoin: round;
  }
  circle {
    fill: var(--primary, #7b1fa2);
  }
</style>
