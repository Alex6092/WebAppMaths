<script lang="ts">
  import { registry } from '@app/content';
  import { checkAnswer, generateQuestion, type MistakeDto } from '@app/core';
  import { Widget, type Phase } from '../../widgets';

  /**
   * La question exacte ratée par l'enfant (régénérée depuis sa graine) : ses réponses avec les
   * erreurs marquées, puis la bonne réponse. Rien n'est modifiable.
   */
  let { mistake, onclose }: { mistake: MistakeDto; onclose: () => void } = $props();

  const plugin = $derived(registry.plugin(mistake.pluginId));
  const question = $derived(plugin ? generateQuestion(plugin, mistake.level, mistake.seed) : null);
  const tabs = $derived([
    ...mistake.answers.map((_, i) => ({
      id: i,
      label: i === 0 ? '1re réponse' : `${i + 1}e réponse`,
    })),
    { id: -1, label: 'Bonne réponse' },
  ]);
  let tab = $state(0);

  const view = $derived.by(() => {
    if (!plugin || !question) return null;
    const solution = plugin.solve(question);
    if (tab < 0) return { answer: solution, phase: 'revealed' as Phase, marks: null, solution };
    const answer = $state.snapshot(mistake.answers[tab]);
    return {
      answer,
      phase: 'review' as Phase,
      marks: checkAnswer(plugin, question, answer).marks,
      solution,
    };
  });
  const explanation = $derived(
    plugin && question ? (plugin.explain?.(question, mistake.answers[0] as never) ?? null) : null,
  );
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="overlay" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="card viewer" role="dialog" aria-modal="true" aria-label="Question ratée">
    {#if plugin && question && view}
      <header>
        <h2>{plugin.icon} {plugin.title}</h2>
        <p class="meta">
          Niveau {mistake.level} · {plugin.levels[mistake.level - 1]?.label} ·
          {new Date(mistake.createdAt).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
          · {mistake.solved ? 'corrigée au 2e essai' : 'non trouvée'}
        </p>
      </header>
      <div class="tabs" role="tablist">
        {#each tabs as t (t.id)}
          <button
            class="btn small"
            class:ghost={tab !== t.id}
            role="tab"
            aria-selected={tab === t.id}
            onclick={() => (tab = t.id)}>{t.label}</button
          >
        {/each}
      </div>
      <p class="instruction">{question.instruction}</p>
      <!-- La question telle que l'enfant l'a vue, figée. -->
      <div class="frozen" inert>
        {#key tab}
          <Widget
            {question}
            answer={view.answer}
            phase={view.phase}
            marks={view.marks}
            solution={view.solution}
            onvalidate={() => {}}
          />
        {/key}
      </div>
      {#if explanation}<p class="explanation">💡 {explanation}</p>{/if}
    {:else}
      <p>Cet exercice n’existe plus.</p>
    {/if}
    <button class="btn" onclick={onclose}>Fermer</button>
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
  .viewer {
    max-width: 760px;
    width: 100%;
    max-height: 92vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  header {
    text-align: center;
  }
  h2 {
    color: var(--primary-dark);
    font-size: 1.25rem;
  }
  .meta {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .instruction {
    font-weight: 700;
    color: var(--primary-dark);
    font-size: 1.15rem;
    text-align: center;
  }
  .frozen {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  /* Les claviers à l'écran ne servent à rien ici. */
  .frozen :global(.numpad),
  .frozen :global(.keyboard) {
    display: none;
  }
  .explanation {
    background: #fff8e1;
    border: 2px solid #ffd54f;
    border-radius: 16px;
    padding: 10px 16px;
  }
</style>
