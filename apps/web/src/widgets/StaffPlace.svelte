<script lang="ts">
  import { fromPosition, midiOf, note, type StaffItem } from '@app/core';
  import Staff from '../pictures/Staff.svelte';
  import { playNotes } from '../lib/sounds';
  import { isLocked, type WidgetProps } from './types';

  /**
   * Poser des notes sur la portée : l'enfant touche une ligne ou un interligne, et la note s'y
   * pose (et sonne). Plusieurs notes se posent de gauche à droite.
   */
  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'staff-place'> = $props();

  const locked = $derived(isLocked(phase));
  const given = $derived(question.given ?? []);
  const shown = $derived(phase === 'revealed' && solution ? solution.positions : answer.positions);
  const toItem = (position: number): StaffItem => ({
    note: note(fromPosition(position, question.clef)),
  });
  const items = $derived([...given.map(toItem), ...shown.map(toItem)]);

  const COLORS: Record<string, string | undefined> = {
    chosen: 'var(--primary, #7b1fa2)',
    ok: 'var(--ok, #2e7d32)',
    wrong: 'var(--wrong, #c62828)',
    expected: 'var(--accent-dark, #e65100)',
  };
  function stateOf(i: number): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return 'expected';
    if (phase === 'review') return marks?.[i] === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && marks?.[i] === 'ok') return 'ok';
    return 'chosen';
  }
  const colors = $derived([
    ...given.map(() => undefined),
    ...shown.map((_, i) => COLORS[stateOf(i)]),
  ]);

  let svg: SVGSVGElement | undefined = $state();

  /** La place (ligne ou interligne) sous le doigt. */
  function placeAt(event: PointerEvent): number | null {
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const y = point.matrixTransform(matrix.inverse()).y;
    const position = Math.round(-y / 5);
    return Math.min(question.max, Math.max(question.min, position));
  }

  function onpointerdown(event: PointerEvent) {
    if (locked) return;
    const position = placeAt(event);
    if (position === null) return;
    event.preventDefault();
    if (question.count === 1) answer.positions = [position];
    else if (answer.positions.length < question.count)
      answer.positions = [...answer.positions, position];
    else return;
    playNotes([{ midi: midiOf(note(fromPosition(position, question.clef))), beats: 1 }]);
  }
</script>

<div class="prompt">{question.prompt}</div>

<div class="place" class:locked data-testid="staff-place">
  <Staff
    bind:svg
    kind={question.clef}
    {items}
    {colors}
    range={[question.min, question.max]}
    slots={locked ? 0 : Math.max(0, question.count - answer.positions.length)}
    {onpointerdown}
  />
</div>

{#if question.count > 1 && !locked}
  <div class="tools">
    <span class="count">{answer.positions.length} / {question.count}</span>
    <button
      class="btn small ghost"
      disabled={answer.positions.length === 0}
      onclick={() => (answer.positions = answer.positions.slice(0, -1))}>↶ Effacer</button
    >
  </div>
{/if}

<style>
  .prompt {
    background: var(--surface);
    border-radius: 24px;
    padding: 14px 32px;
    box-shadow: var(--shadow);
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-dark);
    text-align: center;
  }
  .place {
    touch-action: none;
    cursor: pointer;
    user-select: none;
  }
  .place.locked {
    cursor: default;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .count {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
</style>
