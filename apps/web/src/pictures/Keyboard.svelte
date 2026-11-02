<script lang="ts">
  import { isBlackKey } from '@app/core';

  /**
   * Un morceau de clavier de piano, de la touche blanche from à la touche blanche to (numéros
   * MIDI). Avec onpress, les touches se touchent (le widget piano).
   */
  interface Props {
    from: number;
    to: number;
    /** Touches marquées d'un point. */
    marks?: readonly number[];
    /** Le nom écrit sur chaque do. */
    labels?: boolean;
    /** Couleur de certaines touches (la correction, la touche qu'on vient de toucher). */
    colors?: Record<number, string>;
    /** Numéro écrit sur certaines touches (l'ordre d'une suite de notes). */
    numbers?: Record<number, string>;
    paper?: boolean;
    small?: boolean;
    onpress?: (midi: number) => void;
  }
  let {
    from,
    to,
    marks = [],
    labels = false,
    colors = {},
    numbers = {},
    paper = false,
    small = false,
    onpress,
  }: Props = $props();

  const W = 24;
  const H = 100;
  const keys = $derived(Array.from({ length: to - from + 1 }, (_, i) => from + i));
  const whites = $derived(keys.filter((k) => !isBlackKey(k)));
  const blacks = $derived(keys.filter((k) => isBlackKey(k)));
  /** Abscisse d'une touche noire : à cheval sur les deux blanches. */
  const blackX = (k: number) => whites.indexOf(k - 1) * W + W - 7.5;
  const whiteX = (k: number) => whites.indexOf(k) * W;
  const width = $derived(whites.length * W);
  const scale = $derived(paper ? (small ? 0.022 : 0.03) : small ? 1.4 : 2);
  const unit = $derived(paper ? 'cm' : 'px');

  function press(event: PointerEvent, midi: number) {
    if (!onpress) return;
    event.preventDefault();
    onpress(midi);
  }
</script>

<svg
  class="keyboard"
  class:active={!!onpress}
  width="{(width + 2) * scale}{unit}"
  height="{(H + 2) * scale}{unit}"
  viewBox="-1 -1 {width + 2} {H + 2}"
  role={onpress ? 'group' : 'img'}
  aria-label="Un clavier de piano"
>
  {#each whites as k (k)}
    <rect
      class="white"
      data-key={k}
      x={whiteX(k)}
      y="0"
      width={W}
      height={H}
      rx="2.5"
      style:fill={colors[k]}
      role={onpress ? 'button' : undefined}
      aria-label={onpress ? `touche ${k}` : undefined}
      onpointerdown={(e) => press(e, k)}
    />
    {#if labels && k % 12 === 0}
      <text class="label" x={whiteX(k) + W / 2} y={H - 9}>do</text>
    {/if}
  {/each}
  {#each blacks as k (k)}
    <rect
      class="black"
      data-key={k}
      x={blackX(k)}
      y="0"
      width="15"
      height="62"
      rx="2"
      style:fill={colors[k]}
      role={onpress ? 'button' : undefined}
      aria-label={onpress ? `touche ${k}` : undefined}
      onpointerdown={(e) => press(e, k)}
    />
  {/each}
  {#each keys as k (k)}
    {@const cx = isBlackKey(k) ? blackX(k) + 7.5 : whiteX(k) + W / 2}
    {@const cy = isBlackKey(k) ? 48 : 76}
    {#if marks.includes(k)}
      <circle class="mark" {cx} {cy} r="6.5" />
    {/if}
    {#if numbers[k]}
      <text class="number" class:on-black={isBlackKey(k)} x={cx} y={cy - (isBlackKey(k) ? 18 : 22)}
        >{numbers[k]}</text
      >
    {/if}
  {/each}
</svg>

<style>
  .keyboard {
    display: block;
    flex: none;
    max-width: 100%;
    height: auto;
    user-select: none;
  }
  .keyboard.active {
    touch-action: none;
  }
  .keyboard.active rect {
    cursor: pointer;
  }
  .white {
    fill: white;
    stroke: #424242;
    stroke-width: 1.2;
  }
  .black {
    fill: #212121;
    stroke: #212121;
  }
  .label {
    font-size: 10px;
    font-weight: 700;
    fill: #757575;
    text-anchor: middle;
    pointer-events: none;
  }
  .mark {
    fill: var(--accent, #ff9800);
    stroke: white;
    stroke-width: 1.5;
    pointer-events: none;
  }
  .number {
    font-size: 12px;
    font-weight: 900;
    fill: var(--primary-dark, #4a148c);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }
  .number.on-black {
    fill: white;
  }
</style>
