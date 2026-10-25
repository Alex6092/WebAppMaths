<script lang="ts">
  import { registry } from '@app/content';
  import {
    checkAnswer,
    generateQuestion,
    getWidget,
    questionSpeech,
    randomSeed,
    type CheckResult,
  } from '@app/core';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { navigate } from '../lib/router.svelte';
  import { Widget, type Phase } from '../widgets';

  // Galerie de relecture : chaque plugin, chaque niveau, une graine au choix.
  let pluginId = $state(registry.plugins[0]?.id ?? '');
  let level = $state(1);
  let seed = $state(randomSeed());
  let phase = $state<Phase>('answering');
  let result = $state.raw<CheckResult | null>(null);

  const plugin = $derived(registry.plugin(pluginId));
  const question = $derived(
    plugin ? generateQuestion(plugin, Math.min(level, plugin.levels.length), seed) : null,
  );
  let answer = $state<any>(null);
  const solution = $derived(plugin && question ? plugin.solve(question) : null);

  $effect(() => {
    if (question) {
      answer = getWidget(question.widget).emptyAnswer(question as never);
      phase = 'answering';
      result = null;
    }
  });

  function validate() {
    if (!plugin || !question) return;
    result = checkAnswer(plugin, question, $state.snapshot(answer));
    phase = result.correct ? 'success' : 'retry';
  }
</script>

<div class="screen">
  <div class="top">
    <button class="btn ghost small" onclick={() => navigate('/parent')}>⬅️ Retour</button>
    <h1 class="title">Galerie des exercices</h1>
  </div>

  <div class="card controls">
    <div class="field">
      <label for="plugin">Exercice</label>
      <select id="plugin" bind:value={pluginId} onchange={() => (level = 1)}>
        {#each registry.plugins as p (p.id)}<option value={p.id}>{p.title} ({p.id})</option>{/each}
      </select>
    </div>
    {#if plugin}
      <div class="field">
        <label for="level">Niveau</label>
        <select id="level" bind:value={level}>
          {#each plugin.levels as l, i (i)}<option value={i + 1}
              >{i + 1}. {l.label} ({l.grade})</option
            >{/each}
        </select>
      </div>
    {/if}
    <div class="field">
      <label for="seed">Graine</label>
      <input id="seed" type="number" min="0" bind:value={seed} />
    </div>
    <button class="btn small" onclick={() => (seed = randomSeed())}>🎲 Nouvelle graine</button>
  </div>

  {#if plugin && question}
    <div class="instruction">
      <span>{question.instruction}</span>
      <SpeakButton text={questionSpeech(question)} />
    </div>
    {#key `${pluginId}-${level}-${seed}`}
      <Widget
        {question}
        bind:answer
        {phase}
        marks={result?.marks ?? null}
        {solution}
        onvalidate={validate}
      />
    {/key}
    <div class="row">
      <button class="btn success small" onclick={validate}>Vérifier</button>
      <button class="btn accent small" onclick={() => (phase = 'revealed')}>Voir la solution</button
      >
    </div>
    {#if result}
      <p class="result">
        {result.correct ? '✅ Juste' : '❌ Faux'} · score {Math.round(result.score * 100)} %
      </p>
      {#if !result.correct && plugin.explain}<p>
          💡 {plugin.explain(question, $state.snapshot(answer))}
        </p>{/if}
    {/if}
    <details class="card">
      <summary>Question (JSON)</summary>
      <pre>{JSON.stringify(question, null, 2)}</pre>
    </details>
  {/if}
</div>

<style>
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }
  .controls .field {
    flex: 1;
    min-width: 160px;
  }
  .instruction {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.2rem;
    font-weight: 700;
  }
  .row {
    display: flex;
    gap: 12px;
  }
  .result {
    font-weight: 700;
  }
  pre {
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
