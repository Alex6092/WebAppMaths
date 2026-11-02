<script lang="ts">
  import Keyboard from '../pictures/Keyboard.svelte';
  import PictureView from '../pictures/PictureView.svelte';
  import { playNotes } from '../lib/sounds';
  import { isLocked, type WidgetProps } from './types';

  /**
   * Jouer au piano : l'enfant touche la touche de la note écrite (ou plusieurs, dans l'ordre).
   * Chaque touche sonne ; avec plusieurs notes, un numéro dit l'ordre des touches touchées.
   */
  let { question, answer = $bindable(), phase, marks, solution }: WidgetProps<'piano'> = $props();

  const locked = $derived(isLocked(phase));
  const shown = $derived(phase === 'revealed' && solution ? solution.keys : answer.keys);

  const COLORS: Record<string, string> = {
    chosen: '#ce93d8',
    ok: '#a5d6a7',
    wrong: '#ef9a9a',
    expected: '#ffcc80',
  };

  function stateOf(i: number): string {
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return 'expected';
    if (phase === 'review') return marks?.[i] === 'ok' ? 'ok' : 'wrong';
    if (phase === 'retry' && marks?.[i] === 'ok') return 'ok';
    return 'chosen';
  }

  const colors = $derived(
    Object.fromEntries(shown.map((k, i) => [k, COLORS[stateOf(i)]!])) as Record<number, string>,
  );
  const numbers = $derived.by(() => {
    if (question.count < 2) return {};
    const out: Record<number, string> = {};
    shown.forEach((k, i) => (out[k] = out[k] ? `${out[k]},${i + 1}` : String(i + 1)));
    return out;
  });

  function press(midi: number) {
    playNotes([{ midi, beats: 1 }]);
    if (locked) return;
    if (question.count === 1) answer.keys = [midi];
    else if (answer.keys.length < question.count) answer.keys = [...answer.keys, midi];
  }
</script>

{#if question.picture}
  <PictureView picture={question.picture} />
{/if}

<div class="piano" data-testid="piano">
  <Keyboard
    from={question.from}
    to={question.to}
    labels={question.labels}
    {colors}
    {numbers}
    onpress={press}
  />
</div>

{#if question.count > 1 && !locked}
  <div class="tools">
    <span class="count">{answer.keys.length} / {question.count}</span>
    <button
      class="btn small ghost"
      disabled={answer.keys.length === 0}
      onclick={() => (answer.keys = answer.keys.slice(0, -1))}>↶ Effacer</button
    >
  </div>
{/if}

<style>
  .piano {
    max-width: 100%;
    overflow-x: auto;
    padding: 4px;
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
