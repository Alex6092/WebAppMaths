<script lang="ts">
  import { encode } from 'uqr';

  /** Un QR code en SVG (tracé ici : rien d'injecté dans la page). */
  let { text, label }: { text: string; label: string } = $props();

  const qr = $derived(encode(text, { ecc: 'M', border: 2 }));
  const path = $derived(
    qr.data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join(''),
  );
</script>

<svg
  class="qr"
  viewBox="0 0 {qr.size} {qr.size}"
  role="img"
  aria-label={label}
  shape-rendering="crispEdges"
>
  <rect width={qr.size} height={qr.size} fill="#fff" />
  <path d={path} fill="#000" />
</svg>

<style>
  .qr {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
