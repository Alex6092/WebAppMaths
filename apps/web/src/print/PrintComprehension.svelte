<script lang="ts">
  import type { ComprehensionAnswer, ComprehensionQuestion } from '@app/core';

  /**
   * Une histoire sur papier : l'adulte la lit (son texte est sur le corrigé, les phrases qui
   * donnent les réponses surlignées), ou l'enfant la lit seul (Lecture) ; il coche une réponse
   * par question.
   */
  let {
    question,
    solution = null,
  }: { question: ComprehensionQuestion; solution?: ComprehensionAnswer | null } = $props();

  const chosen = (i: number, id: string) => solution?.selected[i] === id;
  const paragraphs = $derived(
    question.story.map((p, n) => ({
      first: question.story.slice(0, n).reduce((sum, q) => sum + q.length, 0),
      sentences: p,
    })),
  );
  const proofsOf = (s: number) =>
    question.items.flatMap((item, i) => (item.proof === s ? [i + 1] : []));

  // Les événements, dans l'ordre où ils sont montrés : l'enfant écrit leur numéro dans la case.
  const events = $derived(question.events ?? []);
  /** La case de l'événement e dans le bon ordre (à partir de 1). */
  const stepOf = (e: number) => (solution?.order?.indexOf(e) ?? -1) + 1;
</script>

{#if question.read}
  <p class="told">📖 {question.title}</p>
{:else}
  <p class="told">
    🎧 L’adulte lit l’histoire « {question.title} »{question.lang?.startsWith('en')
      ? ' en anglais'
      : ''}.
  </p>
{/if}
<!-- À lire seul, le texte est sur la fiche de l'enfant ; à écouter, sur le corrigé pour l'adulte. -->
{#if solution || question.read}
  <div class="story" class:key-story={solution !== null} lang={question.lang}>
    {#each paragraphs as paragraph (paragraph.first)}
      <p>
        {#each paragraph.sentences as sentence, k (k)}
          {@const proofs = solution
            ? [
                ...proofsOf(paragraph.first + k),
                ...events.flatMap((ev, e) => (ev.proof === paragraph.first + k ? [stepOf(e)] : [])),
              ]
            : []}
          {k ? ' ' : ''}<span class:proof={proofs.length > 0}
            >{sentence}{#if proofs.length}<sup class="key"> ({proofs.join(', ')})</sup>{/if}</span
          >
        {/each}
      </p>
    {/each}
    {#if solution && question.translation}
      <div class="translation" lang="fr">
        {#each question.translation as paragraph, n (n)}<p>{paragraph}</p>{/each}
      </div>
    {/if}
  </div>
{/if}
{#if question.items.length}
  <ol class="items">
    {#each question.items as item, i (i)}
      <li>
        <p class="ask">{item.ask}</p>
        <ul class="choices">
          {#each item.choices as choice (choice.id)}
            <li>
              <span class="check" class:key-box={chosen(i, choice.id)}
                >{chosen(i, choice.id) ? '✗' : ''}</span
              >
              {#if choice.icon}<span class="icon">{choice.icon}</span>{/if}
              <span>{choice.label}</span>
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ol>
{/if}
{#if events.length}
  <p class="ask">Numérote les événements dans l’ordre de l’histoire (1, 2, 3…).</p>
  <ul class="events">
    {#each events as event, e (e)}
      <li>
        <span class="check step" class:key-box={solution !== null}>{solution ? stepOf(e) : ''}</span
        >
        <span>{event.text}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .told {
    margin: 0 0 0.15cm;
    font-size: 13pt;
    font-weight: 700;
  }
  /* Sur la fiche de l'enfant (Lecture), le texte en grand ; sur le corrigé, cadre rouge. */
  .story {
    margin: 0 0 0.3cm;
    padding: 0.25cm 0.35cm;
    border: 1px solid #888;
    border-radius: 4px;
    font-size: 11pt;
    line-height: 1.45;
  }
  .story:not(.key-story) {
    font-size: 13pt;
    line-height: 1.6;
  }
  .story.key-story {
    border-color: #d32f2f;
  }
  .story p {
    margin: 0 0 0.15cm;
  }
  .translation {
    margin-top: 0.15cm;
    padding-top: 0.15cm;
    border-top: 1px dashed #888;
    font-style: italic;
    color: #444;
  }
  .proof {
    background: #fff59d;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .items {
    margin: 0;
    padding-left: 0.6cm;
    display: flex;
    flex-direction: column;
    gap: 0.25cm;
  }
  .ask {
    margin: 0 0 0.1cm;
    font-size: 12.5pt;
  }
  .choices {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.15cm 0.7cm;
    font-size: 12pt;
  }
  .choices li {
    display: flex;
    align-items: center;
    gap: 0.2cm;
  }
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.5cm;
    height: 0.5cm;
    border: 1px solid #444;
    border-radius: 2px;
    font-weight: 700;
  }
  .events {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2cm;
    font-size: 12pt;
  }
  .events li {
    display: flex;
    align-items: center;
    gap: 0.25cm;
  }
  .check.step {
    flex: none;
    width: 0.7cm;
    height: 0.7cm;
  }
  .key,
  .key-box {
    color: #d32f2f;
    font-weight: 700;
  }
  .key-box {
    border-color: #d32f2f;
  }
  .icon {
    font-size: 15pt;
  }
</style>
