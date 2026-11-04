<script lang="ts">
  import type { AssessmentDto } from '@app/core';

  /** L'avis de l'enseignant sur une notion (🏫 A, ECA ou NA), la date et l'évaluation en infobulle. */
  let { assessment }: { assessment: AssessmentDto } = $props();

  const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR');
</script>

<span
  class="teacher {assessment.result}"
  title="Avis de l’enseignant : {assessment.title}, le {day(assessment.assessedOn)}"
  >🏫 {assessment.result}</span
>

<style>
  .teacher {
    justify-self: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .A {
    background: #c8e6c9;
    color: #1b5e20;
  }
  .ECA {
    background: #bbdefb;
    color: #0d47a1;
  }
  .NA {
    background: #ffe0b2;
    color: #b45309;
  }
</style>
