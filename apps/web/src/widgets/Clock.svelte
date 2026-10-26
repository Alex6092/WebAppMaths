<script lang="ts">
  import { CLOCK_MINUTES, onDial } from '@app/core';
  import Dial from '../pictures/Dial.svelte';
  import { HOUR_LENGTH } from '../pictures/dial';
  import { isLocked, type WidgetProps } from './types';

  /**
   * Régler l'horloge : l'enfant tourne la grande aiguille, et la petite avance avec elle comme sur
   * une vraie horloge ; la petite aiguille se tourne aussi, d'heure en heure. Les boutons et les
   * flèches du clavier font la même chose, pas à pas.
   */
  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'clock'> = $props();

  const locked = $derived(isLocked(phase));
  const r = $derived(question.minuteLabels ? 62 : 51);
  const shown = $derived(phase === 'revealed' && solution ? solution.minutes : answer.minutes);

  function handState(hand: 'hour' | 'minute'): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return 'expected';
    if (phase === 'review') return marks?.[hand] === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && marks?.[hand] === 'ok') return 'ok';
    return '';
  }

  let svg: SVGSVGElement | undefined = $state();
  /** L'aiguille tenue, et la dernière minute lue sous le doigt (pour compter les tours). */
  let drag: { hand: 'hour' | 'minute'; minute: number } | null = null;

  /** Angle (degrés depuis le 12) et distance au centre du doigt, en unités du cadran. */
  function pointer(event: PointerEvent): { angle: number; dist: number } | null {
    const box = svg?.getBoundingClientRect();
    if (!box) return null;
    const scale = (2 * r) / box.width;
    const x = (event.clientX - box.left - box.width / 2) * scale;
    const y = (event.clientY - box.top - box.height / 2) * scale;
    const angle = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
    return { angle, dist: Math.hypot(x, y) };
  }

  const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

  function onpointerdown(event: PointerEvent) {
    if (locked) return;
    const p = pointer(event);
    if (!p || p.dist > r) return;
    const m = onDial(answer.minutes);
    const hourAngle = (m / CLOCK_MINUTES) * 360;
    const minuteAngle = ((m % 60) / 60) * 360;
    // Près du centre et du côté de la petite aiguille : c'est elle qu'on prend.
    const hand =
      p.dist <= HOUR_LENGTH + 8 && gap(p.angle, hourAngle) < gap(p.angle, minuteAngle)
        ? 'hour'
        : 'minute';
    drag = { hand, minute: m % 60 };
    svg?.setPointerCapture(event.pointerId);
    event.preventDefault();
    onpointermove(event);
  }

  function onpointermove(event: PointerEvent) {
    if (!drag || locked) return;
    const p = pointer(event);
    if (!p) return;
    const m = onDial(answer.minutes);
    if (drag.hand === 'minute') {
      // La grande aiguille compte les tours : passer le 12 change l'heure.
      const minute = Math.round(p.angle / 6) % 60;
      let delta = minute - drag.minute;
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      drag.minute = minute;
      answer.minutes = onDial(m + delta);
    } else {
      const hour = Math.round(p.angle / 30 - (m % 60) / 60);
      answer.minutes = onDial(hour * 60 + (m % 60));
    }
  }

  function onpointerup() {
    if (!drag) return;
    drag = null;
    // L'aiguille se cale sur le pas de la question (la demi-heure, les 5 minutes…).
    const step = Math.min(question.step, 60);
    answer.minutes = onDial(Math.round(answer.minutes / step) * step);
  }

  function turn(delta: number) {
    if (!locked) answer.minutes = onDial(answer.minutes + delta);
  }
  const minuteStep = $derived(Math.min(question.step, 60));

  function onkeydown(event: KeyboardEvent) {
    if (locked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowRight') turn(minuteStep);
    else if (event.key === 'ArrowLeft') turn(-minuteStep);
    else if (event.key === 'ArrowUp') turn(60);
    else if (event.key === 'ArrowDown') turn(-60);
    else return;
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<div class="prompt">{question.prompt}</div>

<svg
  bind:this={svg}
  class="clock"
  class:locked
  viewBox="{-r} {-r} {2 * r} {2 * r}"
  role="img"
  aria-label="Horloge à régler"
  data-testid="clock"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
>
  <Dial
    minutes={shown}
    minuteLabels={question.minuteLabels}
    hourState={handState('hour')}
    minuteState={handState('minute')}
  />
</svg>

{#if !locked}
  <div class="buttons">
    <div class="pair hour">
      <button aria-label="Petite aiguille en arrière" onclick={() => turn(-60)}>‹</button>
      <span>petite aiguille</span>
      <button aria-label="Petite aiguille en avant" onclick={() => turn(60)}>›</button>
    </div>
    <div class="pair minute">
      <button aria-label="Grande aiguille en arrière" onclick={() => turn(-minuteStep)}>‹</button>
      <span>grande aiguille</span>
      <button aria-label="Grande aiguille en avant" onclick={() => turn(minuteStep)}>›</button>
    </div>
  </div>
{/if}

<style>
  .prompt {
    background: var(--surface);
    border-radius: 24px;
    padding: 14px 32px;
    box-shadow: var(--shadow);
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .clock {
    width: min(340px, 80vw);
    height: auto;
    touch-action: none;
    cursor: grab;
    user-select: none;
  }
  .clock.locked {
    cursor: default;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px 24px;
  }
  .pair {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
  }
  .pair.hour span {
    color: #c62828;
  }
  .pair.minute span {
    color: #1565c0;
  }
  .pair button {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 2.2rem;
    font-weight: 700;
    line-height: 1;
    color: var(--primary-dark);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
  }
  .pair button:active {
    transform: translateY(2px);
  }
</style>
