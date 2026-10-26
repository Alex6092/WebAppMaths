<script lang="ts">
  import { PLACE_COLORS, type Place } from '@app/content';
  import { textAt } from '../../geometry/svg';

  /** Le matériel de la classe : plaques de 100, barres de 10 et cubes de 1. */
  let { value }: { value: number } = $props();

  /** Écart entre deux plaques, entre deux barres (ou colonnes de cubes), entre deux groupes. */
  const PLATE_GAP = 0.8;
  const BAR_PITCH = 1.4;
  const GROUP_GAP = 1.5;
  /** Largeur moyenne d'une lettre des noms (police de 30px à l'échelle 1/20). */
  const CHAR_WIDTH = 0.8;

  const NAMES: Record<Place, string> = { c: 'centaine', d: 'dizaine', u: 'unité' };
  const label = (count: number, place: Place) => `${count} ${NAMES[place]}${count > 1 ? 's' : ''}`;

  function widthOf(place: Place, count: number): number {
    if (place === 'c') return count * (10 + PLATE_GAP) - PLATE_GAP;
    // Les cubes vont par colonnes de 5.
    const columns = place === 'd' ? count : Math.ceil(count / 5);
    return columns * BAR_PITCH - (BAR_PITCH - 1);
  }

  const layout = $derived.by(() => {
    const counts: [Place, number][] = [
      ['c', Math.floor(value / 100)],
      ['d', Math.floor(value / 10) % 10],
      ['u', value % 10],
    ];
    let x = 0;
    const groups = [];
    for (const [place, count] of counts) {
      if (count === 0) continue;
      const width = widthOf(place, count);
      // Le nom du groupe doit tenir dessous : le groupe est centré dans sa place.
      const slot = Math.max(width, label(count, place).length * CHAR_WIDTH);
      groups.push({ place, count, x: x + (slot - width) / 2, width });
      x += slot + GROUP_GAP;
    }
    return { groups, width: Math.max(1, x - GROUP_GAP) };
  });
</script>

<svg
  class="base-ten"
  viewBox="-0.5 -0.5 {layout.width + 1} 13.4"
  role="img"
  aria-label={layout.groups.map((g) => label(g.count, g.place)).join(', ')}
>
  {#each layout.groups as g (g.place)}
    {@const color = PLACE_COLORS[g.place]}
    <g fill={color.fill} stroke={color.ink} stroke-width="0.08">
      {#each { length: g.count } as _, i (i)}
        {#if g.place === 'c'}
          {@const x0 = g.x + i * (10 + PLATE_GAP)}
          <rect x={x0} y="0" width="10" height="10" />
          {#each { length: 9 } as _, k (k)}
            <line x1={x0 + k + 1} y1="0" x2={x0 + k + 1} y2="10" />
            <line x1={x0} y1={k + 1} x2={x0 + 10} y2={k + 1} />
          {/each}
        {:else if g.place === 'd'}
          {@const x0 = g.x + i * BAR_PITCH}
          <rect x={x0} y="0" width="1" height="10" />
          {#each { length: 9 } as _, k (k)}
            <line x1={x0} y1={k + 1} x2={x0 + 1} y2={k + 1} />
          {/each}
        {:else}
          <rect
            x={g.x + Math.floor(i / 5) * BAR_PITCH}
            y={9 - (i % 5) * BAR_PITCH}
            width="1"
            height="1"
          />
        {/if}
      {/each}
    </g>
    <text transform={textAt(g.x + g.width / 2, 12.8)} text-anchor="middle" fill={color.ink}
      >{label(g.count, g.place)}</text
    >
  {/each}
</svg>

<style>
  .base-ten {
    width: 100%;
    max-width: 460px;
    display: block;
    margin: 0 auto;
  }
  text {
    font-size: 30px;
    font-weight: 700;
  }
</style>
