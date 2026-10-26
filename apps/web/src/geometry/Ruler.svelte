<script lang="ts" module>
  export interface RulerPose {
    /** Position du 0 sur le bord gradué (cm). */
    x: number;
    y: number;
    /** Angle en degrés. */
    angle: number;
  }

  /** Longueur graduée d'une règle qui tient dans la figure. */
  export function rulerLength(width: number): number {
    return Math.max(5, Math.min(15, Math.floor(width - 1.5)));
  }

  /** La règle posée sous la figure, dans le bac (2 cm sous la figure). */
  export function restingPose(width: number, height: number): RulerPose {
    return { x: (width - rulerLength(width)) / 2, y: height + 0.3, angle: 0 };
  }
</script>

<script lang="ts">
  import type { Pt } from '@app/core';
  import { textAt, toFigure } from './svg';

  /**
   * Règle graduée en cm et mm. On la fait glisser par sa partie gauche ; on la tourne autour
   * du 0 par son dernier tiers (marqué de flèches), qui reste visible même au bord de la figure.
   */
  interface Props {
    length: number;
    pose: RulerPose;
    /** Points où le 0 et le bord viennent s'aimanter. */
    snapTo: Pt[];
    /** Taille du dessin : le 0 reste toujours dedans. */
    width: number;
    height: number;
  }
  let { length, pose = $bindable(), snapTo, width, height }: Props = $props();

  const HEIGHT = 1.3;
  /** Bande du bord gradué, laissée libre pour placer un point le long de la règle. */
  const EDGE = 0.3;
  const SNAP_DISTANCE = 0.45;
  const SNAP_ANGLE = 2;
  const turnFrom = $derived(Math.round(length * 0.66));

  const ticks = $derived(
    Array.from({ length: length * 10 + 1 }, (_, i) => ({
      x: i / 10,
      size: i % 10 === 0 ? 0.42 : i % 5 === 0 ? 0.3 : 0.17,
      number: i % 10 === 0 ? i / 10 : null,
    })),
  );

  let drag: { kind: 'move'; dx: number; dy: number } | { kind: 'turn'; offset: number } | null =
    null;
  let turning = $state(false);

  const toDegrees = (r: number) => (r * 180) / Math.PI;
  const angleTo = (p: Pt) => toDegrees(Math.atan2(p.y - pose.y, p.x - pose.x));

  function pointer(event: PointerEvent): Pt | null {
    const svg = (event.currentTarget as SVGGraphicsElement).ownerSVGElement;
    return svg ? toFigure(svg, event) : null;
  }

  function start(event: PointerEvent, kind: 'move' | 'turn') {
    const p = pointer(event);
    if (!p) return;
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    // Pour tourner : on garde l'angle entre le doigt et le bord, sans à-coup.
    drag =
      kind === 'move'
        ? { kind, dx: p.x - pose.x, dy: p.y - pose.y }
        : { kind, offset: angleTo(p) - pose.angle };
    turning = kind === 'turn';
  }

  function move(event: PointerEvent) {
    if (!drag) return;
    const p = pointer(event);
    if (!p) return;
    if (drag.kind === 'move') {
      pose = {
        ...pose,
        x: Math.max(0.2, Math.min(width - 0.2, p.x - drag.dx)),
        y: Math.max(0.2, Math.min(height - 0.2, p.y - drag.dy)),
      };
    } else pose = { ...pose, angle: snapAngle(angleTo(p) - drag.offset) };
  }

  function end() {
    if (drag?.kind === 'move') {
      // Le 0 s'aimante sur un point proche : comme quand on pose la règle sur A.
      const near = snapTo.find((p) => Math.hypot(p.x - pose.x, p.y - pose.y) < SNAP_DISTANCE);
      if (near) pose = { ...pose, x: near.x, y: near.y };
    }
    drag = null;
    turning = false;
  }

  /** Le bord s'aligne sur un point visé depuis le 0, ou sur l'horizontale et la verticale. */
  function snapAngle(angle: number): number {
    const targets = snapTo
      .filter((p) => Math.hypot(p.x - pose.x, p.y - pose.y) > 0.5)
      .map(angleTo)
      .concat([-180, -90, 0, 90, 180]);
    // La cible la plus proche : un point presque aligné ne doit pas « voler » l'aimant.
    let best = angle;
    let bestDiff = SNAP_ANGLE;
    for (const target of targets) {
      const diff = Math.abs(((angle - target + 540) % 360) - 180);
      if (diff < bestDiff) {
        best = target;
        bestDiff = diff;
      }
    }
    return best;
  }

  /** Flèche courbe (tourner), centrée en (x, y). */
  function arrow(x: number, y: number, flip: boolean): string {
    const s = flip ? -1 : 1;
    return (
      `M${x - 0.28 * s},${y + 0.1} Q${x},${y - 0.3} ${x + 0.28 * s},${y + 0.1} ` +
      `M${x + 0.12 * s},${y + 0.06} L${x + 0.28 * s},${y + 0.1} L${x + 0.32 * s},${y - 0.07}`
    );
  }
</script>

<g class="ruler" transform="translate({pose.x} {pose.y}) rotate({pose.angle})" data-testid="ruler">
  <rect class="body" x="-0.5" y="0" width={length + 1} height={HEIGHT} rx="0.12" />
  <rect
    class="turn-zone"
    class:turning
    x={turnFrom}
    y={EDGE}
    width={length + 0.5 - turnFrom}
    height={HEIGHT - EDGE}
  />
  {#each ticks as t (t.x)}
    <line class="tick" x1={t.x} y1="0" x2={t.x} y2={t.size} />
    {#if t.number !== null}
      <text class="number" transform={textAt(t.x, 0.85)}>{t.number}</text>
    {/if}
  {/each}
  <path class="arrow" d={arrow(length - 0.5, 1.05, false)} />
  <path class="arrow" d={arrow(turnFrom + 0.5, 1.05, true)} />
  <!-- Zones à attraper : tout sauf le bord gradué, pour pouvoir placer un point le long du bord. -->
  <rect
    class="grip move"
    role="slider"
    aria-label="Déplacer la règle"
    aria-valuenow={Math.round(pose.x * 10) / 10}
    tabindex="-1"
    x="-0.5"
    y={EDGE}
    width={turnFrom + 0.5}
    height={HEIGHT - EDGE}
    onpointerdown={(e) => start(e, 'move')}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
  />
  <rect
    class="grip turn"
    role="slider"
    aria-label="Tourner la règle"
    aria-valuenow={Math.round(pose.angle)}
    tabindex="-1"
    x={turnFrom}
    y={EDGE}
    width={length + 0.5 - turnFrom}
    height={HEIGHT - EDGE}
    onpointerdown={(e) => start(e, 'turn')}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
  />
</g>

<style>
  .body {
    fill: rgba(255, 236, 153, 0.55);
    stroke: #c9a227;
    stroke-width: 0.04;
    pointer-events: none;
  }
  .turn-zone {
    fill: rgba(255, 193, 7, 0.28);
    pointer-events: none;
  }
  .turn-zone.turning {
    fill: rgba(255, 160, 0, 0.45);
  }
  .grip {
    fill: transparent;
  }
  .grip.move {
    cursor: grab;
  }
  .grip.turn {
    cursor: alias;
  }
  .tick {
    stroke: #5d4b00;
    stroke-width: 0.025;
    pointer-events: none;
  }
  .number {
    font-size: 7px;
    fill: #5d4b00;
    text-anchor: middle;
    pointer-events: none;
  }
  .arrow {
    fill: none;
    stroke: #8d6e00;
    stroke-width: 0.06;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
</style>
