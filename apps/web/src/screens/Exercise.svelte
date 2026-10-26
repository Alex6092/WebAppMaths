<script lang="ts">
  import { registry } from '@app/content';
  import {
    checkAnswer,
    createRng,
    DAILY_LENGTH,
    generateQuestion,
    getWidget,
    initialLevel,
    maxTries,
    pickMixPlugin,
    questionSignature,
    questionSpeech,
    randomSeed,
    type AnyPlugin,
    type AttemptResponse,
    type DailyState,
    type Mark,
    type Notion,
    type PluginQuestion,
    type ReviewItem,
    type SessionSummary,
    type StartSessionResponse,
  } from '@app/core';
  import { getTheme } from '@app/themes';
  import { onMount, untrack } from 'svelte';
  import ChildBar from '../components/ChildBar.svelte';
  import LessonCard from '../components/LessonCard.svelte';
  import NotionBadge from '../components/NotionBadge.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { api, errorMessage } from '../lib/api';
  import { celebrateBadges } from '../lib/badges';
  import { masteryOf } from '../lib/notions';
  import { confetti, praise, toast } from '../lib/effects.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, session, setCoins } from '../lib/session.svelte';
  import { playSound } from '../lib/sounds';
  import { stopSpeaking } from '../lib/tts';
  import { HAS_OWN_SUBMIT, Widget, type Phase } from '../widgets';

  /**
   * Un exercice (pluginId), ou un mélange des exercices de plusieurs notions (mix).
   * Le défi du jour (daily) est un mélange de toutes les notions de la classe ;
   * « Revoir mes erreurs » (review) repose les questions ratées, à l'identique.
   */
  let {
    pluginId,
    mix,
    daily = false,
    review = false,
  }: { pluginId?: string; mix?: string[]; daily?: boolean; review?: boolean } = $props();

  let reviewItems = $state.raw<ReviewItem[]>([]);
  /** Une série de questions comptées (mélange, défi, erreurs), et sa longueur. */
  const series = $derived(Boolean(mix) || review);
  const seriesLength = $derived(review ? reviewItems.length : daily ? DAILY_LENGTH : 10);
  const mixPlugins = $derived(mix ? registry.pluginsOfNotions(mix) : []);
  // Dans un mélange, l'exercice change à chaque question.
  let plugin = $state.raw<AnyPlugin | undefined>(
    untrack(() => (pluginId ? registry.plugin(pluginId) : undefined)),
  );
  let questionNumber = $state(0);
  let practiced = $state<string[]>([]);
  let lessonOpen = $state(false);
  const lessonNotions = $derived(
    (plugin?.notions ?? [])
      .map((id) => registry.notion(id))
      .filter((n): n is Notion => Boolean(n?.lesson)),
  );

  /** Retour : la matière de l'exercice, ou celle du mélange s'il n'en touche qu'une. */
  const backPath = $derived.by(() => {
    if (review) return '/home';
    const ids = mix ?? plugin?.notions.slice(0, 1) ?? [];
    const subjects = new Set(
      ids.map((id) => registry.domain(registry.notion(id)?.domain ?? '')?.subject),
    );
    const [only] = subjects;
    return subjects.size === 1 && only ? `/subject/${only}` : '/home';
  });
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
  /** Le défi du jour, une fois réussi pendant cette séance. */
  let dailyDone = $state<DailyState | null>(null);
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
    if (!review && (mix ? mixPlugins.length === 0 : !plugin)) return;
    try {
      const state = session.childState ?? (await loadChildState());
      if (plugin && !mix && !review)
        level = state.levels[plugin.id]?.level ?? initialLevel(plugin, state.child.grade);
      const started = await api.post<StartSessionResponse>(
        'child/sessions',
        review
          ? { mode: 'review', selection: {} }
          : daily
            ? { mode: 'daily', selection: {} }
            : mix
              ? { mode: 'mix', selection: { notions: mix } }
              : { mode: 'training', selection: { pluginId: plugin!.id } },
      );
      sessionId = started.id;
      reviewItems = started.items ?? [];
      // Le défi du jour reprend là où il s'était arrêté.
      questionNumber = started.answered;
      nextQuestion();
    } catch (error) {
      loadError = errorMessage(error);
    }
  }

  function nextQuestion() {
    // Une question à revoir garde son exercice, son niveau et sa graine.
    let replay: number | null = null;
    if (review) {
      const item = reviewItems[questionNumber];
      plugin = item && registry.plugin(item.pluginId);
      if (!item || !plugin) return void finish();
      level = item.level;
      replay = item.seed;
    } else if (mix) {
      if (questionNumber >= seriesLength) return void finish();
      const state = session.childState;
      const next = pickMixPlugin(
        createRng(randomSeed()),
        mixPlugins,
        mix,
        state?.notions ?? {},
        plugin?.id,
      );
      plugin = next;
      level = state?.levels[next.id]?.level ?? initialLevel(next, state?.child.grade ?? 'CE1');
    }
    const current = plugin;
    if (!current) return;
    stopSpeaking();
    questionNumber++;
    // On évite de reposer une question déjà vue pendant la séance.
    const signature = (q: PluginQuestion) => `${current.id}:${questionSignature(current, q)}`;
    let s = replay ?? randomSeed();
    let q = generateQuestion(current, level, s);
    for (let i = 0; replay === null && i < 20 && seen.has(signature(q)); i++) {
      s = randomSeed();
      q = generateQuestion(current, level, s);
    }
    seen.add(signature(q));
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
      playSound('correct');
    } else if (answers.length < maxTries(plugin)) {
      phase = 'retry';
      playSound('wrong');
      answer = widget.retryAnswer(question as never, given as never, result);
      feedback = {
        kind: 'error',
        text: result.feedback ?? 'Oups ! Ce qui est en rouge n’est pas juste. Réessaie ! 💪',
      };
      return;
    } else {
      phase = 'revealed';
      playSound('wrong');
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
        playSound('levelUp');
      } else if (res.levelChange === 'down') {
        toast(`Pas de souci, on s’entraîne au niveau ${res.level} 💪`);
      }
      if (res.daily && session.childState) session.childState.daily = res.daily;
      // Le compteur « à revoir » de l'accueil : une question réparée, ou une nouvelle erreur.
      if (session.childState) {
        if (review && res.firstTryCorrect) session.childState.mistakes--;
        if (!review && !res.firstTryCorrect) session.childState.mistakes++;
      }
      if (res.dailyBonus > 0 && res.daily) {
        dailyDone = res.daily;
        toast(`🎯 Défi du jour réussi ! +${res.dailyBonus} ${theme.currency.icon}`, 3500);
        confetti();
        playSound('daily');
      }
      celebrateBadges(res.badges);
      // Une question revue garde son niveau ; ailleurs, on suit le niveau de l’exercice.
      if (!review) level = res.level;
      practiced = [...new Set([...practiced, ...Object.keys(res.notions)])];
      if (session.childState) {
        Object.assign(session.childState.notions, res.notions);
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
    if (sessionId === null) return navigate(backPath);
    try {
      summary = await api.post<SessionSummary>(`child/sessions/${sessionId}/end`);
    } catch {
      navigate(backPath);
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
    {#if series}
      <span class="badge"
        >{review ? '🔁' : daily ? '🎯' : '🎲'}
        {Math.min(questionNumber, seriesLength)}/{seriesLength}</span
      >
    {/if}
    <span class="badge" title={levelLabel}>Niveau {level}</span>
  </ChildBar>

  {#if mix && mixPlugins.length === 0}
    <div class="card">Il n’y a rien à mélanger ici pour l’instant.</div>
  {:else if !mix && !review && !plugin}
    <div class="card">Cet exercice n’existe pas (ou plus).</div>
  {:else if loadError}
    <div class="error-msg">{loadError}</div>
  {:else if question && plugin}
    <h1 class="exercise-title">{plugin.icon} {plugin.title}</h1>
    <p class="level-label">
      {levelLabel}
      {#if lessonNotions.length}
        <button class="btn ghost small lesson-btn" onclick={() => (lessonOpen = true)}
          >📖 Leçon</button
        >
      {/if}
    </p>

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
      <button class="btn next" disabled={saving} onclick={nextQuestion}
        >{series && questionNumber >= seriesLength ? 'Terminer 🏁' : 'Suivant ➡️'}</button
      >
    {:else if !HAS_OWN_SUBMIT[question.widget]}
      <button class="btn success" onclick={validate}>Valider ✓</button>
    {/if}
  {/if}
</div>

{#if lessonOpen}
  <LessonCard notions={lessonNotions} onclose={() => (lessonOpen = false)} />
{/if}

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
      {#if dailyDone}
        <p class="daily-done">
          🎯 Défi du jour réussi !<br />🔥 {dailyDone.streak.current} jour{dailyDone.streak
            .current > 1
            ? 's'
            : ''} de suite
        </p>
      {/if}
      {#if practiced.length}
        <ul class="practiced">
          {#each practiced as id (id)}
            <li>
              <span>{registry.notion(id)?.title}</span>
              <NotionBadge mastery={masteryOf(id)} />
            </li>
          {/each}
        </ul>
      {/if}
      <button class="btn" onclick={() => navigate(backPath)}>Continuer</button>
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
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .lesson-btn {
    padding: 4px 12px;
  }
  .practiced {
    list-style: none;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.95rem;
  }
  .practiced li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
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
  .daily-done {
    font-weight: 700;
    color: var(--accent-dark);
  }
</style>
