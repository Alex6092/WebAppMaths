<script lang="ts">
  import { registry } from '@app/content';
  import type { EvaluationQuestion, EvaluationReport, MistakeDto } from '@app/core';
  import { printable } from '../../lib/portal';
  import EvaluationCodes from '../EvaluationCodes.svelte';
  import MistakeViewer from './MistakeViewer.svelte';

  /**
   * Le bilan d'une évaluation blanche, au gabarit des évaluations de l'école : prénom, date,
   * une ligne par compétence avec son barème ( x / n ) et son code, puis le détail des questions.
   * Il s'imprime seul.
   */
  let { report, onclose }: { report: EvaluationReport; onclose: () => void } = $props();

  let viewing = $state<{ mistake: MistakeDto; note: string } | null>(null);

  const date = $derived(
    new Date(report.completedAt ?? report.startedAt ?? report.createdAt).toLocaleDateString(
      'fr-FR',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    ),
  );
  const notion = (id: string) => registry.notion(id);
  const domainIcon = (id: string) => registry.domain(notion(id)?.domain ?? '')?.icon ?? '';
  const questionsOf = (notionId: string) => report.questions.filter((q) => q.notionId === notionId);

  function open(q: EvaluationQuestion) {
    if (!q.answers) return;
    viewing = {
      mistake: {
        ...q,
        answers: q.answers,
        solved: q.correct ?? false,
        createdAt: q.answeredAt ?? report.createdAt,
      },
      note: q.correct ? 'juste' : 'faux',
    };
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && !viewing && onclose()} />

<div class="overlay" use:printable>
  <div class="card sheet" role="dialog" aria-modal="true" aria-label="Bilan de l’évaluation">
    <header>
      <h2>📋 {report.title}</h2>
      <p class="kind">Évaluation blanche</p>
      <div class="identity">
        <span>Prénom : <strong>{report.firstName}</strong></span>
        <span>Classe : <strong>{report.grade}</strong></span>
        <span>Date : <strong>{date}</strong></span>
      </div>
    </header>

    {#if !report.completedAt}
      <p class="pending no-print">
        ⏳ Pas encore finie : {report.answered}/{report.total} questions répondues.
      </p>
    {/if}

    <table>
      <thead>
        <tr><th>Compétence</th><th class="score">Barème</th><th class="code">Code</th></tr>
      </thead>
      <tbody>
        {#each report.lines as line (line.notionId)}
          <tr>
            <td>
              <span class="competence"
                >{domainIcon(line.notionId)}
                {notion(line.notionId)?.competence ?? notion(line.notionId)?.title}</span
              >
              <span class="marks">
                {#each questionsOf(line.notionId) as q, i (i)}
                  <button
                    class="mark"
                    class:right={q.correct === true}
                    class:wrong={q.correct === false}
                    disabled={!q.answers}
                    title={q.answers ? 'Voir la question' : 'Pas encore répondue'}
                    onclick={() => open(q)}
                    >{q.correct === null ? '–' : q.correct ? '✓' : '✗'}</button
                  >
                {/each}
              </span>
            </td>
            <td class="score">( {line.points} / {line.total} )</td>
            <td class="code"><EvaluationCodes code={line.code} /></td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td class="score">( {report.points} / {report.total} )</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <p class="legend">
      A : acquis (au moins les trois quarts de réponses justes) · ECA : en cours d’acquisition (au
      moins la moitié) · NA : non acquis.
      <span class="no-print">Touche un ✓ ou un ✗ pour revoir la question.</span>
    </p>
    <p class="signature">Signature des parents :</p>

    <div class="actions no-print">
      <button class="btn" onclick={() => window.print()}>🖨️ Imprimer</button>
      <button class="btn ghost" onclick={onclose}>Fermer</button>
    </div>
  </div>

  {#if viewing}
    <MistakeViewer mistake={viewing.mistake} note={viewing.note} onclose={() => (viewing = null)} />
  {/if}
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 10, 60, 0.45);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 16px;
    overflow-y: auto;
    z-index: 55;
  }
  .sheet {
    max-width: 820px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: #222;
  }
  header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 10px;
  }
  h2 {
    font-size: 1.4rem;
    color: var(--primary-dark);
  }
  .kind {
    color: var(--text-soft);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.8rem;
  }
  .identity {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 20px;
    margin-top: 10px;
  }
  .pending {
    background: #fff8e1;
    border-radius: 12px;
    padding: 8px 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    border: 1px solid #bbb;
    padding: 8px 10px;
    text-align: left;
    vertical-align: middle;
  }
  th {
    background: #f3eef8;
  }
  .score,
  .code {
    text-align: center;
    white-space: nowrap;
  }
  .score {
    font-weight: 700;
    width: 90px;
  }
  .code {
    width: 170px;
  }
  tfoot td {
    font-weight: 700;
  }
  .competence {
    display: block;
    font-weight: 700;
  }
  .marks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }
  .mark {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 2px solid #ccc;
    background: white;
    font-weight: 700;
    cursor: pointer;
  }
  .mark.right {
    border-color: #66bb6a;
    color: #1b5e20;
  }
  .mark.wrong {
    border-color: #ef5350;
    color: #b71c1c;
  }
  .mark:disabled {
    cursor: default;
    color: #999;
  }
  .legend {
    font-size: 0.85rem;
    color: var(--text-soft);
  }
  .signature {
    margin-top: 10px;
    padding-bottom: 36px;
    border-bottom: 1px dashed #999;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  @media (max-width: 560px) {
    .code {
      width: auto;
    }
    th,
    td {
      padding: 6px;
    }
  }
  @media print {
    .overlay {
      position: static;
      display: block;
      background: none;
      padding: 0;
      overflow: visible;
    }
    .sheet {
      box-shadow: none;
      max-width: none;
      padding: 0;
    }
    h2 {
      color: #000;
    }
    th {
      background: #eee;
    }
    .mark {
      width: 22px;
      height: 22px;
      border-width: 1px;
    }
  }
</style>
