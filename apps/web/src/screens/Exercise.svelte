<script lang="ts">
  import { registry } from '@app/content';
  import {
    checkAnswer,
    generateQuestion,
    getWidget,
    initialLevel,
    maxTries,
    questionSignature,
    questionSpeech,
    randomSeed,
    type AttemptResponse,
    type Mark,
    type PluginQuestion,
    type SessionSummary,
  } from '@app/core';
  import { getTheme } from '@app/themes';
  import { onMount } from 'svelte';
  import ChildBar from '../components/ChildBar.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { api, errorMessage } from '../lib/api';
  import { confetti, praise, toast } from '../lib/effects.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, session, setCoins } from '../lib/session.svelte';
  import { stopSpeaking } from '../lib/tts';
  import { HAS_OWN_SUBMIT, Widget, type Phase } from '../widgets';

  let { pluginId }: { pluginId: string } = $props();

  const plugin = $derived(registry.plugin(pluginId));
  const subjectId = $derived(plugin ? registry.subjectOf(plugin)?.id : undefined);
  const theme = $derived(getTheme(activeChild()?.themeId));

  let sessionId: number | null = null;
  let level = $state(1);
  let seed = $state(0);
  let question = $state.raw<PluginQuestion | null>(null);
  let answer = $state<any>(null);
  let phase = $state<Phase>('answering');
  let marks = $state.raw<Record<string, Mark> | null>(null);
  let feedback = $state<{ kind: 'neutral' | 'success' | 'error'; text: string }>({
    kind: 'neutral',
    text: '',
  });
  let explanation = $state<string | null>(null);
  let saving = $state(false);
  let summary = $state<SessionSummary | null>(null);
  let loadError = $state<string | null>(null);
  let answers: unknown[] = [];
  let startedAt = 0;
  // Simple mémoire des questions déjà posées : rien à afficher, donc pas besoin de réactivité.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const seen = new Set<string>();

  const solution = $derived(
    question && plugin && phase !== 'answering' ? plugin.solve(question) : null,
  );
  const levelLabel = $derived(plugin?.levels[level - 1]?.label ?? '');

  onMount(() => {
    void start();
    return stopSpeaking;
  });

  async function start() {
    if (!plugin) return;
    try {
      const state = session.childState ?? (await loadChildState());
      level = state.levels[plugin.id]?.level ?? initialLevel(plugin, state.child.grade);
      sessionId = (
        await api.post<{ id: number }>('child/sessions', {
          mode: 'training',
          selection: { pluginId: plugin.id },
        })
      ).id;
      nextQuestion();
    } catch (error) {
      loadError = errorMessage(error);
    }
  }

  function nextQuestion() {
    if (!plugin) return;
    stopSpeaking();
    // On évite de reposer une question déjà vue pendant la séance.
    let s = randomSeed();
    let q = generateQuestion(plugin, level, s);
    for (let i = 0; i < 20 && seen.has(questionSignature(plugin, q)); i++) {
      s = randomSeed();
      q = generateQuestion(plugin, level, s);
    }
    seen.add(questionSignature(plugin, q));
    seed = s;
    question = q;
    answer = getWidget(q.widget).emptyAnswer(q as never);
    answers = [];
    marks = null;
    phase = 'answering';
    explanation = null;
    feedback = { kind: 'neutral', text: '' };
    startedAt = performance.now();
  }

  async function validate() {
    if (!plugin || !question || saving || phase === 'success' || phase === 'revealed') return;
    const widget = getWidget(question.widget);
    if (!widget.isComplete(question as never, answer)) {
      feedback = { kind: 'neutral', text: 'Complète toutes les cases avant de valider ! 🔵' };
      return;
    }
    const given = $state.snapshot(answer);
    answers.push(given);
    const result = checkAnswer(plugin, question, given);
    marks = result.marks;

    if (result.correct) {
      phase = 'success';
      feedback = { kind: 'success', text: `🎉 ${praise()}` };
      confetti();
    } else if (answers.length < maxTries(plugin)) {
      phase = 'retry';
      answer = widget.retryAnswer(question as never, given as never, result);
      feedback = {
        kind: 'error',
        text: 'Oups ! Ce qui est en rouge n’est pas juste. Réessaie ! 💪',
      };
      return;
    } else {
      phase = 'revealed';
      explanation = plugin.explain?.(question, given) ?? null;
      feedback = { kind: 'error', text: 'Pas grave ! Regarde la bonne réponse. 👀' };
    }
    await sendAttempt();
  }

  async function sendAttempt() {
    if (!plugin || sessionId === null) return;
    saving = true;
    try {
      const res = await api.post<AttemptResponse>('child/attempts', {
        sessionId,
        pluginId: plugin.id,
        pluginVersion: plugin.version,
        level,
        seed,
        answers,
        durationMs: Math.round(performance.now() - startedAt),
      });
      setCoins(res.coins);
      if (res.coinsEarned > 0) {
        feedback = {
          kind: 'success',
          text: `🎉 ${praise()} Tu gagnes ${res.coinsEarned} ${theme.currency.plural} ${theme.currency.icon}`,
        };
      }
      if (res.levelChange === 'up') {
        toast(`⬆️ Niveau supérieur : ${plugin.levels[res.level - 1]?.label}`);
        confetti();
      } else if (res.levelChange === 'down') {
        toast(`Pas de souci, on s’entraîne au niveau ${res.level} 💪`);
      }
      level = res.level;
      if (session.childState) {
        session.childState.levels[plugin.id] = {
          level: res.level,
          recent: [],
          consecutiveErrors: 0,
        };
      }
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      saving = false;
    }
  }

  async function finish() {
    stopSpeaking();
    if (sessionId === null) return navigate(subjectId ? `/subject/${subjectId}` : '/home');
    try {
      summary = await api.post<SessionSummary>(`child/sessions/${sessionId}/end`);
    } catch {
      navigate(subjectId ? `/subject/${subjectId}` : '/home');
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || summary) return;
    event.preventDefault();
    if (phase === 'success' || phase === 'revealed') {
      if (!saving) nextQuestion();
    } else void validate();
  }
</script>

<svelte:window {onkeydown} />

<div class="screen">
  <ChildBar back={{ label: 'J’ai fini', onclick: finish }}>
    <span class="badge" title={levelLabel}>Niveau {level}</span>
  </ChildBar>

  {#if !plugin}
    <div class="card">Cet exercice n’existe pas (ou plus).</div>
  {:else if loadError}
    <div class="error-msg">{loadError}</div>
  {:else if question}
    <h1 class="exercise-title">{plugin.icon} {plugin.title}</h1>
    <p class="level-label">{levelLabel}</p>

    <div class="instruction">
      <span>{question.instruction}</span>
      <SpeakButton text={questionSpeech(question)} />
    </div>

    {#key seed}
      <Widget {question} bind:answer {phase} {marks} {solution} onvalidate={validate} />
    {/key}

    {#if feedback.text}
      <div class="feedback {feedback.kind}" role="status">{feedback.text}</div>
    {/if}
    {#if explanation}
      <div class="explanation">💡 {explanation}</div>
    {/if}

    {#if phase === 'success' || phase === 'revealed'}
      <button class="btn next" disabled={saving} onclick={nextQuestion}>Suivant ➡️</button>
    {:else if !HAS_OWN_SUBMIT[question.widget]}
      <button class="btn success" onclick={validate}>Valider ✓</button>
    {/if}
  {/if}
</div>

{#if summary}
  <div class="overlay">
    <div class="card summary">
      <div class="big">🌟</div>
      <h2>Bravo {activeChild()?.firstName} !</h2>
      <p>
        <strong>{summary.nFirstTry}</strong> réponse{summary.nFirstTry > 1 ? 's' : ''} juste{summary.nFirstTry >
        1
          ? 's'
          : ''} du premier coup sur <strong>{summary.nQuestions}</strong>
      </p>
      <p>{theme.currency.icon} +{summary.coinsEarned} {theme.currency.plural}</p>
      <button class="btn" onclick={() => navigate(subjectId ? `/subject/${subjectId}` : '/home')}
        >Continuer</button
      >
    </div>
  </div>
{/if}

<style>
  .exercise-title {
    font-size: 1.4rem;
    color: var(--primary-dark);
    text-align: center;
  }
  .level-label {
    margin-top: -12px;
    color: var(--text-soft);
  }
  .instruction {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 16px;
    padding: 10px 12px 10px 20px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .feedback {
    font-size: 1.15rem;
    font-weight: 700;
    text-align: center;
    padding: 10px 20px;
    border-radius: 16px;
    max-width: 520px;
    animation: pop 0.25s;
  }
  .feedback.success {
    background: var(--ok-soft);
    color: #1b5e20;
  }
  .feedback.error {
    background: var(--wrong-soft);
    color: #b71c1c;
  }
  .feedback.neutral {
    background: var(--info-soft);
    color: #283593;
  }
  .explanation {
    background: #fff8e1;
    border: 2px solid #ffd54f;
    border-radius: 16px;
    padding: 12px 18px;
    max-width: 520px;
    font-size: 1.1rem;
    line-height: 1.5;
  }
  .next {
    font-size: 1.25rem;
    padding: 14px 34px;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 10, 60, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 50;
  }
  .summary {
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    font-size: 1.15rem;
    animation: pop 0.3s;
  }
  .summary h2 {
    color: var(--primary);
  }
  .big {
    font-size: 3.5rem;
  }
</style>
