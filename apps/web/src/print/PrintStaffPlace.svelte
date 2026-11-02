<script lang="ts">
  import { fromPosition, note, type StaffPlaceAnswer, type StaffPlaceQuestion } from '@app/core';
  import Staff from '../pictures/Staff.svelte';

  /** Poser des notes sur papier : la portée vide à compléter (les notes en rouge au corrigé). */
  let {
    question,
    solution = null,
  }: { question: StaffPlaceQuestion; solution?: StaffPlaceAnswer | null } = $props();

  const toItem = (p: number) => ({ note: note(fromPosition(p, question.clef)) });
  const given = $derived((question.given ?? []).map(toItem));
  const placed = $derived((solution?.positions ?? []).map(toItem));
</script>

<div class="place">
  <p>{question.prompt}</p>
  <Staff
    kind={question.clef}
    items={[...given, ...placed]}
    colors={[...given.map(() => undefined), ...placed.map(() => '#d32f2f')]}
    range={[question.min, question.max]}
    slots={solution ? 0 : question.count}
    paper
  />
</div>

<style>
  .place {
    display: flex;
    flex-direction: column;
    gap: 0.1cm;
  }
  p {
    margin: 0;
    font-size: 13pt;
    font-weight: 700;
  }
</style>
