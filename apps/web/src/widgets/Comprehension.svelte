<script lang="ts">
  import { eventMark, itemSpeech, storySentences } from '@app/core';
  import { untrack } from 'svelte';
  import { speak, speakParts, stopSpeaking, ttsAvailable } from '../lib/tts';
  import { isLocked, type WidgetProps } from './types';

  let {
    question,
    answer = $bindable(),
    phase,
    marks,
    solution,
  }: WidgetProps<'comprehension'> = $props();

  /** Une histoire se raconte un peu plus posément qu'une consigne, moins lentement qu'une dictée. */
  const STORY_RATE = 0.85;

  const sentences = $derived(storySentences(question));
  const locked = $derived(isLocked(phase));
  /** La correction est finie : l'histoire s'affiche, avec les phrases qui donnent les réponses. */
  const corrected = $derived(phase === 'success' || phase === 'revealed' || phase === 'review');
  /** Un texte à lire seul (Lecture) : il s'affiche dès le début, et rien ne le lit à voix haute. */
  const read = untrack(() => question.read === true);
  /** Le lecteur de l'histoire (à l'écoute seulement). */
  const voice = !read && ttsAvailable();

  /** La phrase en cours, ou celle où reprendre après une pause. */
  let position = $state(0);
  let playing = $state(false);
  /** L'histoire a été écoutée jusqu'au bout une fois : les questions apparaissent. */
  let heard = $state(untrack(() => phase !== 'answering') || !voice);
  /** Aucune voix ne marche sur cet appareil : l'histoire se lit à l'écran. */
  let mute = $state(!read && !voice);
  const progress = $derived(
    playing
      ? position / sentences.length
      : heard && position === 0
        ? 1
        : position / sentences.length,
  );

  function listen(from: number) {
    // Une lecture en cours (une question dite au 🔊) se tait d'abord : elle ne nous arrête pas.
    stopSpeaking();
    playing = true;
    position = from;
    speakParts(sentences, 'fr-FR', STORY_RATE, from, {
      onpart: (i) => (position = i),
      onend: () => {
        playing = false;
        position = 0;
        heard = true;
      },
      oninterrupt: () => (playing = false),
      onsilent: () => {
        playing = false;
        position = 0;
        heard = true;
        mute = true;
      },
    });
  }

  // L'histoire démarre toute seule quand la question arrive (pas quand le parent la revoit).
  $effect(() => {
    if (voice && untrack(() => phase) === 'answering') untrack(() => listen(0));
  });

  /** Les questions dont la réponse est dans la phrase s (leurs numéros, à partir de 1). */
  const proofsOf = (s: number) =>
    question.items.flatMap((item, i) => (item.proof === s ? [i + 1] : []));

  const events = $derived(question.events ?? []);
  /** La case de chaque événement dans l'ordre de l'histoire (à partir de 1), d'après sa phrase. */
  const stepOf = (e: number) => events.filter((other) => other.proof < events[e]!.proof).length + 1;
  /** Les événements qui se passent dans la phrase s (leurs cases). */
  const stepsAt = (s: number) => events.flatMap((ev, e) => (ev.proof === s ? [stepOf(e)] : []));

  /** Une question juste au premier essai ne se refait pas. */
  const itemLocked = (i: number) => locked || (phase === 'retry' && marks?.[i] === 'ok');

  function choose(i: number, id: string) {
    if (itemLocked(i)) return;
    answer.selected[i] = id;
  }

  function choiceState(i: number, id: string): string {
    const chosen = answer.selected[i] === id;
    if (phase === 'success') return chosen ? 'ok' : '';
    if (phase === 'revealed') {
      if (solution?.selected[i] === id) return chosen ? 'ok' : 'expected';
      return chosen ? 'wrong' : '';
    }
    if (phase === 'review') return chosen ? (marks?.[i] === 'wrong' ? 'wrong' : 'ok') : '';
    if (phase === 'retry' && marks?.[i] === 'ok') return chosen ? 'ok' : '';
    return chosen ? 'chosen' : '';
  }

  /** L'ordre montré : le bon quand il est révélé, sinon celui de l'enfant. */
  const slots = $derived(
    phase === 'revealed' && solution?.order ? solution.order : (answer.order ?? []),
  );
  const pool = $derived(events.map((_, e) => e).filter((e) => !answer.order?.includes(e)));
  /** Un événement bien placé au premier essai reste à sa place. */
  const slotLocked = (slot: number) =>
    locked || (phase === 'retry' && marks?.[eventMark(slot)] === 'ok');

  /** L'événement se pose dans la première case vide. */
  function place(e: number) {
    if (locked || !answer.order) return;
    const slot = answer.order.indexOf(-1);
    if (slot >= 0) answer.order[slot] = e;
  }

  /** Toucher un événement posé le renvoie dans la réserve ; sa case se libère. */
  function takeBack(slot: number) {
    if (!slotLocked(slot) && answer.order) answer.order[slot] = -1;
  }

  function slotState(slot: number): string {
    const mark = marks?.[eventMark(slot)];
    if (phase === 'success') return 'ok';
    if (phase === 'revealed') return mark === 'ok' ? 'ok' : 'expected';
    if (phase === 'review') return mark === 'ok' ? 'ok' : mark === 'wrong' ? 'wrong' : '';
    if (phase === 'retry' && mark === 'ok') return 'ok';
    if (slots[slot] !== -1) return 'chosen';
    // Au deuxième essai, la case d'un événement mal placé attend en rouge.
    return phase === 'retry' && mark === 'wrong' ? 'was-wrong' : 'empty';
  }

  const itemState = (i: number) =>
    phase === 'retry' && marks?.[i] === 'wrong' && answer.selected[i] === '' ? 'was-wrong' : '';

  // Des réponses longues (des phrases) se lisent mieux l'une sous l'autre ; des mots courts
  // tiennent sur une ligne, même sur un téléphone.
  const isLong = (i: number) => question.items[i]!.choices.some((c) => c.label.length > 28);
  const isShort = (i: number) => question.items[i]!.choices.every((c) => c.label.length <= 12);

  // Chaque paragraphe garde le rang de sa première phrase.
  const paragraphs = $derived(
    question.story.map((p, n) => ({
      first: question.story.slice(0, n).reduce((sum, q) => sum + q.length, 0),
      sentences: p,
    })),
  );
</script>

<div class="story" data-testid="story">
  <div class="cover">
    {#if question.icon}<span class="cover-icon" aria-hidden="true">{question.icon}</span>{/if}
    <h2>{question.title}</h2>
  </div>
  {#if voice}
    <div class="player">
      {#if playing}
        <button class="play" onclick={stopSpeaking}>⏸️ Pause</button>
      {:else if position > 0}
        <button class="play" onclick={() => listen(position)}>▶️ Reprendre</button>
        <button class="play ghost" onclick={() => listen(0)}>⏮️ Depuis le début</button>
      {:else}
        <button class="play" data-testid="story-listen" onclick={() => listen(0)}
          >{heard ? '🔁 Réécouter l’histoire' : '▶️ Écouter l’histoire'}</button
        >
      {/if}
    </div>
    <div
      class="progress"
      role="progressbar"
      aria-label="Avancée de l’histoire"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <span style:width="{progress * 100}%"></span>
    </div>
  {/if}
  {#if mute && !locked}
    <p class="hint">
      🔇 La voix ne marche pas sur cet appareil : lis l’histoire, ou demande à un adulte de te la
      lire.
    </p>
  {:else if !heard}
    <p class="hint">
      👂 Écoute bien l’histoire jusqu’au bout : {question.items.length
        ? 'les questions arrivent'
        : 'les événements à ranger arrivent'} juste après.
    </p>
  {/if}
</div>

{#if read}{@render storyText()}{/if}

{#if heard && question.items.length}
  <ol class="items">
    {#each question.items as item, i (i)}
      <li class="item {itemState(i)}" data-testid="story-item">
        <div class="ask">
          <span class="number">{i + 1}</span>
          <span class="ask-text">{item.ask}</span>
          {#if ttsAvailable()}
            <button
              class="speak"
              onclick={() => speak(itemSpeech(item))}
              aria-label="Écouter la question {i + 1}">🔊</button
            >
          {/if}
        </div>
        <div
          class="choices"
          class:list={isLong(i)}
          class:short={isShort(i)}
          role="radiogroup"
          aria-label={item.ask}
        >
          {#each item.choices as choice (choice.id)}
            <button
              class="choice {choiceState(i, choice.id)}"
              role="radio"
              aria-checked={answer.selected[i] === choice.id}
              disabled={itemLocked(i)}
              onclick={() => choose(i, choice.id)}
            >
              {#if choice.icon}<span class="icon" aria-hidden="true">{choice.icon}</span>{/if}
              <span>{choice.label}</span>
            </button>
          {/each}
        </div>
      </li>
    {/each}
  </ol>
{/if}

{#if heard && events.length}
  <section class="events" data-testid="story-events" aria-label="Les événements à ranger">
    <p class="ask">🔢 Remets les événements dans l’ordre de l’histoire.</p>
    <ol class="slots">
      {#each slots as e, slot (slot)}
        {@const event = events[e]}
        <li class="slot {slotState(slot)}">
          <span class="number">{slot + 1}</span>
          {#if event}
            <button
              class="event placed"
              disabled={slotLocked(slot)}
              aria-label="{event.text} (retirer)"
              onclick={() => takeBack(slot)}>{event.text}</button
            >
          {:else}
            <span class="gap"
              >{slot === slots.indexOf(-1) ? 'Touche l’événement suivant…' : ''}</span
            >
          {/if}
        </li>
      {/each}
    </ol>
    {#if !locked && pool.length > 0}
      <ul class="pool">
        {#each pool as e (e)}
          <li>
            <button class="event" data-testid="story-event" onclick={() => place(e)}
              >{events[e]?.text}</button
            >
            {#if ttsAvailable()}
              <button
                class="speak"
                onclick={() => speak(events[e]?.text ?? '')}
                aria-label="Écouter : {events[e]?.text}">🔊</button
              >
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

{#if !read && (corrected || mute)}{@render storyText()}{/if}

{#snippet storyText()}
  <section class="text" class:reading={read} aria-label="Le texte de l’histoire">
    {#if !read}<h3>📖 L’histoire</h3>{/if}
    {#each paragraphs as paragraph (paragraph.first)}
      <p>
        {#each paragraph.sentences as sentence, k (k)}
          {@const proofs = corrected ? proofsOf(paragraph.first + k) : []}
          {@const steps = corrected ? stepsAt(paragraph.first + k) : []}
          {k ? ' ' : ''}<span class:proof={proofs.length + steps.length > 0}
            >{sentence}{#each proofs as n (n)}<sup class="tag">{n}</sup
              >{/each}{#each steps as n (n)}<sup class="tag step">{n}</sup>{/each}</span
          >
        {/each}
      </p>
    {/each}
  </section>
{/snippet}

<style>
  .story {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 18px 20px;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .cover {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .cover-icon {
    font-size: 3rem;
  }
  h2 {
    margin: 0;
    font-size: 1.6rem;
    color: var(--primary-dark);
  }
  .player {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .play {
    padding: 12px 26px;
    border-radius: 22px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--primary-dark);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
  }
  .play.ghost {
    font-size: 1.1rem;
    box-shadow: none;
  }
  .play:active {
    transform: translateY(2px);
  }
  .progress {
    width: 100%;
    height: 10px;
    border-radius: 5px;
    background: #ede7f6;
    overflow: hidden;
  }
  .progress span {
    display: block;
    height: 100%;
    border-radius: 5px;
    background: var(--primary);
    transition: width 0.4s;
  }
  .hint {
    margin: 0;
    text-align: center;
    color: var(--text-soft);
    font-size: 1.05rem;
  }
  .items {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .item {
    padding: 14px 16px;
    border-radius: 20px;
    border: 3px solid transparent;
    background: var(--surface);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .item.was-wrong {
    border-color: var(--wrong);
    animation: shake 0.4s;
  }
  .ask {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .ask-text {
    flex: 1;
  }
  .number {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    font-size: 1.1rem;
  }
  .speak {
    flex: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--primary-soft);
    background: white;
    font-size: 1.25rem;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .choices.short {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }
  .choices.list {
    grid-template-columns: 1fr;
  }
  .choice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 60px;
    padding: 10px 12px;
    border-radius: 16px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--primary-dark);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
  }
  .choices.list .choice {
    justify-content: flex-start;
    text-align: left;
  }
  .choice:active:not(:disabled) {
    transform: translateY(3px);
  }
  .choice.chosen {
    background: var(--primary);
    border-color: var(--primary-dark);
    color: white;
  }
  .choice.ok {
    background: #a5d6a7;
    border-color: var(--ok);
    color: #1b5e20;
  }
  .choice.wrong {
    background: #ef9a9a;
    border-color: var(--wrong);
    color: var(--wrong);
  }
  .choice.expected {
    background: #ffe0b2;
    border-color: var(--accent-dark);
    color: var(--accent-dark);
  }
  .icon {
    font-size: 1.7em;
  }
  .text {
    width: 100%;
    max-width: 640px;
    padding: 16px 22px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
    font-size: 1.2rem;
    line-height: 1.6;
  }
  /* Le texte à lire seul : plus grand, bien aéré, comme dans un livre de lecture. */
  .text.reading {
    font-size: 1.4rem;
    line-height: 1.8;
  }
  h3 {
    margin: 0 0 6px;
    color: var(--primary-dark);
  }
  .text p {
    margin: 0 0 10px;
  }
  .proof {
    background: #fff59d;
    border-radius: 4px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    padding: 0 2px;
  }
  .events {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .events .ask {
    margin: 0;
  }
  .slots,
  .pool {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .slot {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 60px;
    padding: 6px 8px;
    border-radius: 16px;
    border: 3px dashed var(--primary-soft);
  }
  .slot.chosen {
    border-style: solid;
    border-color: var(--primary);
  }
  .slot.ok {
    border-style: solid;
    border-color: var(--ok);
    background: #e8f5e9;
  }
  .slot.wrong {
    border-style: solid;
    border-color: var(--wrong);
    background: #ffebee;
  }
  .slot.was-wrong {
    border-color: var(--wrong);
    background: #ffebee;
  }
  .slot.expected {
    border-style: solid;
    border-color: var(--accent-dark);
    background: #fff3e0;
  }
  .gap {
    color: var(--text-soft);
    font-size: 1.05rem;
  }
  .pool li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .event {
    flex: 1;
    min-height: 52px;
    padding: 8px 14px;
    border-radius: 14px;
    border: 3px solid var(--primary-soft);
    background: white;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--primary-dark);
    text-align: left;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.1);
  }
  .event.placed {
    border: none;
    box-shadow: none;
    background: transparent;
    padding: 4px 6px;
    min-height: 0;
  }
  .event:disabled {
    cursor: default;
    color: var(--text);
  }
  .event:active:not(:disabled) {
    transform: translateY(2px);
  }
  .tag {
    margin-left: 3px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--primary);
    color: white;
    font-size: 0.7em;
    font-weight: 700;
  }
  .tag.step {
    background: var(--accent-dark);
  }
  @media (max-width: 520px) {
    .event {
      font-size: 1.02rem;
    }
    .story {
      padding: 14px;
    }
    h2 {
      font-size: 1.3rem;
    }
    .ask {
      font-size: 1.1rem;
    }
    .choice {
      font-size: 1.05rem;
    }
    .choices:not(.short) {
      grid-template-columns: 1fr;
    }
    .choices:not(.short) .choice {
      justify-content: flex-start;
      text-align: left;
    }
    .text {
      font-size: 1.05rem;
      padding: 12px 16px;
    }
    .text.reading {
      font-size: 1.2rem;
      line-height: 1.7;
    }
  }
</style>
