<script lang="ts">
  import { isBill } from '@app/core';

  /**
   * Une pièce ou un billet, dessiné simplement (couleurs et tailles proches des vrais, sans leur
   * motif). Les pièces gardent leurs tailles relatives ; les billets sont réduits davantage.
   */
  let {
    value,
    paper = false,
    small = false,
  }: { value: number; paper?: boolean; small?: boolean } = $props();

  /** Diamètre des pièces, en mm. */
  const COIN_MM: Record<number, number> = {
    1: 16.25,
    2: 18.75,
    5: 21.25,
    10: 19.75,
    20: 22.25,
    50: 24.25,
    100: 23.25,
    200: 25.75,
  };
  /** Taille des billets en mm, et leur couleur. */
  const BILL: Record<number, { w: number; h: number; color: string; dark: string }> = {
    500: { w: 120, h: 62, color: '#b0bec5', dark: '#546e7a' },
    1000: { w: 127, h: 67, color: '#ef9a9a', dark: '#b71c1c' },
    2000: { w: 133, h: 72, color: '#90caf9', dark: '#0d47a1' },
    5000: { w: 140, h: 77, color: '#ffcc80', dark: '#e65100' },
  };
  const COPPER = { fill: '#c77b3f', rim: '#8d4f20', ink: '#4a2508' };
  const GOLD = { fill: '#e2bf55', rim: '#a8862b', ink: '#4a3a08' };
  const SILVER = { fill: '#d5d8dc', rim: '#8e9399', ink: '#263238' };

  const bill = $derived(isBill(value) ? BILL[value] : undefined);
  // Pièces : 2,6 px (0,075 cm) par mm ; billets : 0,95 px (0,032 cm) par mm. Petit (dans un
  // choix) : aux trois quarts.
  const size = (mm: number, coin: boolean) => {
    const k = small ? 0.75 : 1;
    return paper
      ? `${(mm * (coin ? 0.075 : 0.032) * k).toFixed(2)}cm`
      : `${Math.round(mm * (coin ? 2.6 : 0.95) * k)}px`;
  };
  const coinMm = $derived(COIN_MM[value] ?? 20);
  const metal = $derived(value < 10 ? COPPER : value < 100 ? GOLD : value === 100 ? SILVER : GOLD);
  /** La couronne des pièces en euros : dorée sur 1 €, argentée sur 2 €. */
  const ring = $derived(value === 100 ? GOLD : value === 200 ? SILVER : null);
  const label = $derived(value >= 100 ? String(value / 100) : String(value));
  const unit = $derived(value >= 100 ? 'euro' : value === 1 ? 'cent' : 'cents');
</script>

{#if bill}
  <svg
    class="bill"
    width={size(bill.w, false)}
    height={size(bill.h, false)}
    viewBox="0 0 {bill.w} {bill.h}"
    role="img"
    aria-label="billet de {value / 100} euros"
  >
    <rect
      x="1"
      y="1"
      width={bill.w - 2}
      height={bill.h - 2}
      rx="5"
      fill={bill.color}
      stroke={bill.dark}
      stroke-width="2"
    />
    <rect
      x="8"
      y="8"
      width={bill.w - 16}
      height={bill.h - 16}
      rx="3"
      fill="none"
      stroke={bill.dark}
      stroke-width="1"
      opacity="0.45"
    />
    <!-- Une arche, comme sur les billets, sans copier leur dessin. -->
    <path
      d="M {bill.w * 0.52} {bill.h - 10} v -{bill.h * 0.36} a {bill.w * 0.13} {bill.w *
        0.13} 0 0 1 {bill.w * 0.26} 0 v {bill.h * 0.36}"
      fill="#ffffff"
      fill-opacity="0.45"
      stroke={bill.dark}
      stroke-width="1.5"
      opacity="0.8"
    />
    <text x="14" y={bill.h * 0.4} class="bill-value" fill={bill.dark}>{label}</text>
    <text x="15" y={bill.h - 11} class="bill-unit" fill={bill.dark}>EURO</text>
    <text x={bill.w - 12} y="22" class="bill-corner" fill={bill.dark}>{label}</text>
  </svg>
{:else}
  <svg
    class="coin"
    width={size(coinMm, true)}
    height={size(coinMm, true)}
    viewBox="-12 -12 24 24"
    role="img"
    aria-label={value >= 100
      ? `pièce de ${value / 100} euro${value > 100 ? 's' : ''}`
      : `pièce de ${value} centime${value > 1 ? 's' : ''}`}
  >
    <circle r="11.4" fill={(ring ?? metal).fill} stroke={(ring ?? metal).rim} stroke-width="0.9" />
    {#if ring}
      <circle r="7.6" fill={metal.fill} stroke={metal.rim} stroke-width="0.5" />
    {:else}
      <circle r="9.6" fill="none" stroke={metal.rim} stroke-width="0.4" opacity="0.6" />
    {/if}
    <text y="-0.6" class="coin-value" fill={metal.ink}>{label}</text>
    <text y="5" class="coin-unit" fill={metal.ink}>{unit}</text>
  </svg>
{/if}

<style>
  svg {
    display: block;
    flex: none;
  }
  text {
    font-family: inherit;
    font-weight: 700;
  }
  .bill-value {
    font-size: 26px;
    dominant-baseline: central;
  }
  .bill-unit {
    font-size: 10px;
    letter-spacing: 1px;
  }
  .bill-corner {
    font-size: 13px;
    text-anchor: end;
  }
  .coin-value {
    font-size: 9px;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .coin-unit {
    font-size: 3.6px;
    text-anchor: middle;
    dominant-baseline: central;
    letter-spacing: 0.2px;
  }
</style>
