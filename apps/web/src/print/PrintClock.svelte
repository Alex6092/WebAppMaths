<script lang="ts">
  import type { ClockAnswer, ClockQuestion } from '@app/core';
  import Dial from '../pictures/Dial.svelte';

  /** Régler l'horloge sur papier : l'heure écrite, et un cadran vide où dessiner les aiguilles. */
  let { question, solution = null }: { question: ClockQuestion; solution?: ClockAnswer | null } =
    $props();

  const r = $derived(question.minuteLabels ? 62 : 51);
</script>

<div class="clock-item">
  <p class="time">{question.prompt}</p>
  <svg
    width="3.6cm"
    height="3.6cm"
    viewBox="{-r} {-r} {2 * r} {2 * r}"
    role="img"
    aria-label="Cadran"
  >
    <Dial
      minutes={solution ? solution.minutes : null}
      minuteLabels={question.minuteLabels}
      ink={solution ? '#d32f2f' : undefined}
    />
  </svg>
</div>

<style>
  .clock-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1cm;
  }
  .time {
    margin: 0;
    font-size: 15pt;
    font-weight: 700;
  }
  svg {
    display: block;
  }
</style>
