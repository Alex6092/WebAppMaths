<script lang="ts">
  import { onLine, type StaffItem } from '@app/core';
  import type { SVGAttributes } from 'svelte/elements';
  import { HALF, layoutStaff, ledgerLines, yOf, type PlacedItem, type StaffKind } from './staff';

  /**
   * Une portée dessinée : clé, chiffrage, notes (avec hampes, crochets, points, dièses et bémols,
   * lignes supplémentaires), silences et barres de mesure. Avec paper, en centimètres.
   */
  interface Props extends SVGAttributes<SVGSVGElement> {
    kind: StaffKind;
    items: readonly StaffItem[];
    time?: number;
    paper?: boolean;
    small?: boolean;
    /** Couleur de chaque élément (la correction : vert, rouge, orange). */
    colors?: readonly (string | undefined)[];
    /** Places à montrer en plus (celles où l'on peut poser une note). */
    range?: [number, number];
    /** Notes encore à poser : de la place à droite, et la prochaine colonne éclairée. */
    slots?: number;
    svg?: SVGSVGElement;
  }
  let {
    kind,
    items,
    time,
    paper = false,
    small = false,
    colors = [],
    range,
    slots = 0,
    svg = $bindable(),
    ...rest
  }: Props = $props();

  const layout = $derived(layoutStaff(kind, items, { time, range, slots }));
  const height = $derived(layout.bottom - layout.top);
  const scale = $derived(paper ? (small ? 0.03 : 0.036) : small ? 1.5 : 2.2);
  const unit = $derived(paper ? 'cm' : 'px');
  const ink = (i: number) => colors[i] ?? 'currentColor';
  const nextSlot = $derived(layout.width - 12 - slots * 34 + 17);

  /** Les lignes d'une portée : 5, ou une seule pour le rythme. */
  const lines = (clef: string) => (clef === 'rhythm' ? [4] : [0, 2, 4, 6, 8]);

  const shiftOf = (p: PlacedItem) => (kind === 'grand' && !p.low ? -70 : 0);
  const mid = (p: PlacedItem) => yOf(4, shiftOf(p));

  function stemEnd(p: PlacedItem): number {
    return p.up ? p.y - 34 : p.y + 34;
  }
  const stemX = (p: PlacedItem) => (p.up ? p.x + 5.6 : p.x - 5.6);
  /** Une croche reliée à sa voisine (par une barre) n'a pas de crochet. */
  const beamed = (i: number) => !!layout.items[i]?.item.beam || !!layout.items[i - 1]?.item.beam;
</script>

<svg
  bind:this={svg}
  class="staff"
  width="{layout.width * scale}{unit}"
  height="{height * scale}{unit}"
  viewBox="0 {layout.top} {layout.width} {height}"
  role="img"
  aria-label="Une portée"
  {...rest}
>
  {#if slots > 0}
    <rect class="slot" x={nextSlot - 15} y={layout.top + 4} width="30" height={height - 8} rx="8" />
  {/if}

  {#each layout.staves as staff, s (s)}
    {#each lines(staff.clef) as line (line)}
      <line
        class="line"
        x1="2"
        x2={layout.width - 4}
        y1={yOf(line, staff.shift)}
        y2={yOf(line, staff.shift)}
      />
    {/each}
    {#if staff.clef === 'treble'}
      <g transform="translate(6 {staff.shift - 40})">
        <path
          class="clef"
          d="M15 31 C10 31 9 25 14 23 C21 21 24 30 19 35 C13 40 4 36 4 28 C4 18 16 13 20 4 C23 -3 20 -12 17 -12 C13 -12 11 -4 12 4 L16 50 C17 56 12 60 9 56"
        />
        <circle cx="10" cy="54.5" r="2.8" />
      </g>
    {:else if staff.clef === 'bass'}
      <g transform="translate(6 {staff.shift - 40})">
        <circle cx="5" cy="10" r="3.6" />
        <path class="clef" d="M3 10 C3 1 17 -1 21 9 C24 19 15 31 3 39" />
        <circle cx="27" cy="5" r="1.9" />
        <circle cx="27" cy="15" r="1.9" />
      </g>
    {/if}
    {#if time}
      {#if staff.clef === 'rhythm'}
        <text class="time small-time" x={layout.start - 10} y={yOf(4) - 7}>{time}</text>
        <text class="time small-time" x={layout.start - 10} y={yOf(4) + 7}>4</text>
      {:else}
        <text class="time" x={layout.start - 10} y={yOf(6, staff.shift)}>{time}</text>
        <text class="time" x={layout.start - 10} y={yOf(2, staff.shift)}>4</text>
      {/if}
    {/if}
  {/each}

  {#if kind === 'grand'}
    <line class="system" x1="2" x2="2" y1={yOf(8, -70)} y2={yOf(0)} />
  {/if}

  {#each layout.items as p, i (i)}
    {@const item = p.item}
    <g style:color={ink(i)} style:fill={ink(i)}>
      {#if item.bar}
        {#if kind === 'rhythm'}
          <line class="bar" x1={p.x} x2={p.x} y1={yOf(4) - 12} y2={yOf(4) + 12} />
        {:else}
          <line class="bar" x1={p.x} x2={p.x} y1={yOf(8, kind === 'grand' ? -70 : 0)} y2={yOf(0)} />
        {/if}
      {:else if item.ask}
        <text class="ask" x={p.x} y={mid(p)}>?</text>
      {:else if item.rest}
        {@const m = mid(p)}
        {#if item.dur === 'h'}
          <rect x={p.x - 6} y={m - 5} width="12" height="5" />
        {:else if item.dur === 'q'}
          <path
            class="rest"
            d="M{p.x - 2} {m - 15} L{p.x + 4} {m - 8} L{p.x - 2} {m - 1} L{p.x + 4} {m + 6} C{p.x -
              4} {m + 3} {p.x - 4} {m + 11} {p.x + 1} {m + 13}"
          />
        {:else if item.dur === 'e'}
          <circle cx={p.x - 3} cy={m - 5} r="2.6" />
          <path
            class="rest-thin"
            d="M{p.x - 4} {m - 3} C{p.x} {m - 2} {p.x + 4} {m - 4} {p.x + 5} {m - 7} L{p.x - 1} {m +
              10}"
          />
        {:else}
          <rect x={p.x - 6} y={kind === 'rhythm' ? m : yOf(6, shiftOf(p))} width="12" height="5" />
        {/if}
      {:else}
        {#each ledgerLines(kind === 'rhythm' ? 4 : p.position) as lp (lp)}
          <line
            class="ledger"
            x1={p.x - 10}
            x2={p.x + 10}
            y1={yOf(lp, shiftOf(p))}
            y2={yOf(lp, shiftOf(p))}
          />
        {/each}
        {#if item.note?.acc === 1}
          <g class="acc">
            <line x1={p.x - 17} x2={p.x - 17} y1={p.y - 9} y2={p.y + 10} />
            <line x1={p.x - 13} x2={p.x - 13} y1={p.y - 10} y2={p.y + 9} />
            <line class="thick" x1={p.x - 20} x2={p.x - 10} y1={p.y - 2} y2={p.y - 5} />
            <line class="thick" x1={p.x - 20} x2={p.x - 10} y1={p.y + 4} y2={p.y + 1} />
          </g>
        {:else if item.note?.acc === -1}
          <path
            class="acc flat"
            d="M{p.x - 17} {p.y - 15} L{p.x - 17} {p.y + 4} C{p.x - 9} {p.y} {p.x - 9} {p.y -
              7} {p.x - 17} {p.y - 3}"
          />
        {/if}
        {@const hollow = !item.dur || item.dur === 'w' || item.dur === 'h'}
        <ellipse
          class="head"
          class:hollow
          class:whole={!item.dur || item.dur === 'w'}
          cx={p.x}
          cy={p.y}
          rx={!item.dur || item.dur === 'w' ? 7 : 6.2}
          ry="4.4"
          transform="rotate(-20 {p.x} {p.y})"
        />
        {#if item.dur && item.dur !== 'w'}
          <line class="stem" x1={stemX(p)} x2={stemX(p)} y1={p.y} y2={stemEnd(p)} />
          {#if (item.dur === 'e' || item.dur === 's') && !beamed(i)}
            {#each item.dur === 's' ? [0, 8] : [0] as off (off)}
              {@const t = stemEnd(p) + (p.up ? off : -off)}
              <path
                class="flag"
                d={p.up
                  ? `M${stemX(p)} ${t} C${stemX(p) + 2} ${t + 8} ${stemX(p) + 11} ${t + 12} ${stemX(p) + 7} ${t + 22}`
                  : `M${stemX(p)} ${t} C${stemX(p) + 2} ${t - 8} ${stemX(p) + 11} ${t - 12} ${stemX(p) + 7} ${t - 22}`}
              />
            {/each}
          {/if}
          {#if item.beam && layout.items[i + 1]}
            {@const q = layout.items[i + 1]!}
            <line class="beam" x1={stemX(p)} x2={stemX(q)} y1={stemEnd(p)} y2={stemEnd(q)} />
            {#if item.dur === 's'}
              <line
                class="beam"
                x1={stemX(p)}
                x2={stemX(q)}
                y1={stemEnd(p) + (p.up ? 7 : -7)}
                y2={stemEnd(q) + (q.up ? 7 : -7)}
              />
            {/if}
          {/if}
        {/if}
        {#if item.dot}
          <circle cx={p.x + 11} cy={onLine(p.position) ? p.y - HALF / 2 - 0.5 : p.y} r="1.9" />
        {/if}
      {/if}
    </g>
  {/each}
</svg>

<style>
  .staff {
    display: block;
    flex: none;
    max-width: 100%;
    height: auto;
    color: #212121;
    fill: #212121;
    overflow: visible;
  }
  .line,
  .ledger {
    stroke: #424242;
    stroke-width: 1.1;
  }
  .ledger {
    stroke-width: 1.4;
  }
  .system {
    stroke: #424242;
    stroke-width: 1.6;
  }
  .bar {
    stroke: #424242;
    stroke-width: 1.4;
  }
  .clef {
    fill: none;
    stroke: #212121;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .time {
    font-size: 22px;
    font-weight: 900;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .small-time {
    font-size: 13px;
  }
  .ask {
    font-size: 26px;
    font-weight: 900;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--accent-dark, #e65100);
  }
  .head.hollow {
    fill: white;
    stroke: currentColor;
    stroke-width: 2.4;
  }
  .head.whole {
    stroke-width: 2.8;
  }
  .stem {
    stroke: currentColor;
    stroke-width: 1.6;
  }
  .flag,
  .rest,
  .rest-thin,
  .flat {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .rest {
    stroke-width: 2.8;
  }
  .rest-thin,
  .flat {
    stroke-width: 1.8;
  }
  .beam {
    stroke: currentColor;
    stroke-width: 4.5;
  }
  .acc line {
    stroke: currentColor;
    stroke-width: 1.4;
  }
  .acc .thick {
    stroke-width: 2.6;
  }
  .slot {
    fill: #fff3e0;
    stroke: var(--accent, #ff9800);
    stroke-width: 1.2;
    stroke-dasharray: 4 3;
  }
</style>
