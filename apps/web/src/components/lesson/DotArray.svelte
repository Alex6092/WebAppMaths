<script lang="ts">
  /** Des ronds en rows lignes de cols : 3 lignes de 4, c'est 3 × 4. */
  let { rows, cols }: { rows: number; cols: number } = $props();

  const COLORS = ['#ef5350', '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc'];
</script>

<svg
  class="dots"
  viewBox="0 0 {cols * 1.2 + 0.2} {rows * 1.2 + 0.2}"
  style:max-width="{cols * 38}px"
  role="img"
  aria-label="{rows} lignes de {cols}"
>
  {#each { length: rows } as _, r (r)}
    {#each { length: cols } as _, c (c)}
      <circle cx={0.7 + c * 1.2} cy={0.7 + r * 1.2} r="0.45" fill={COLORS[r % COLORS.length]} />
    {/each}
  {/each}
</svg>

<style>
  .dots {
    width: 100%;
    display: block;
    margin: 0 auto;
  }
</style>
