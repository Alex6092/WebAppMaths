<script lang="ts">
  import type { Notion } from '@app/core';
  import { lessonParagraphs, masteryOf } from '../lib/notions';
  import NotionBadge from './NotionBadge.svelte';
  import SpeakButton from './SpeakButton.svelte';

  /** La fiche de leçon d'une ou plusieurs notions, comme celles du cahier. */
  let { notions, onclose }: { notions: Notion[]; onclose: () => void } = $props();

  const speech = (n: Notion) => [n.title, n.lesson?.replaceAll('**', '') ?? ''].join('. ');
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="overlay" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="card lesson" role="dialog" aria-modal="true" aria-label="Leçon">
    {#each notions as notion (notion.id)}
      <section>
        <header>
          <h2>📖 {notion.title}</h2>
          <SpeakButton text={speech(notion)} />
        </header>
        <NotionBadge mastery={masteryOf(notion.id)} />
        {#if notion.lesson}
          {#each lessonParagraphs(notion.lesson) as paragraph, p (p)}
            <p>
              {#each paragraph as part, i (i)}{#if part.bold}<strong>{part.text}</strong
                  >{:else}{part.text}{/if}{/each}
            </p>
          {/each}
        {:else if notion.competence}
          <p>{notion.competence}</p>
        {/if}
      </section>
    {/each}
    <button class="btn" onclick={onclose}>J’ai compris 👍</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 10, 60, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 60;
  }
  .lesson {
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    animation: pop 0.25s;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h2 {
    color: var(--primary-dark);
    font-size: 1.3rem;
  }
  p {
    font-size: 1.15rem;
    line-height: 1.55;
  }
  strong {
    color: var(--primary);
  }
  .btn {
    align-self: center;
  }
</style>
