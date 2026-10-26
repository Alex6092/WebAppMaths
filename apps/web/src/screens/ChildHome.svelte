<script lang="ts">
  import { registry } from '@app/content';
  import { addDays, DAILY_BONUS, DAILY_LENGTH, HOMEWORK_BONUS } from '@app/core';
  import { getTheme } from '@app/themes';
  import { onMount } from 'svelte';
  import ChildBar from '../components/ChildBar.svelte';
  import { dueNotions } from '../lib/notions';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, selectChild, session } from '../lib/session.svelte';

  const theme = $derived(getTheme(activeChild()?.themeId));
  const daily = $derived(session.childState?.daily);
  const dailyDone = $derived(daily?.streak.doneToday ?? false);
  const assignments = $derived(session.childState?.assignments ?? []);
  const evaluations = $derived(session.childState?.evaluations ?? []);
  const due = $derived(session.childState ? dueNotions() : []);

  /** « pour demain », « pour lundi 3 novembre », « en retard ». */
  function dueLabel(dueOn: string): string {
    const today = session.childState?.daily.day ?? '';
    if (dueOn < today) return 'en retard';
    if (dueOn === today) return 'pour aujourd’hui';
    if (dueOn === addDays(today, 1)) return 'pour demain';
    const date = new Date(`${dueOn}T12:00:00`);
    return `pour ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  }

  // Le défi du jour, les devoirs, les évaluations et la série viennent de l'état de l'enfant :
  // on le recharge à chaque retour à l'accueil (un parent a pu donner un devoir entre-temps).
  onMount(() => {
    loadChildState().catch(() => {});
  });

  const subjects = registry.subjects.map((subject) => ({
    subject,
    count: registry.pluginsOfSubject(subject.id).length,
  }));

  async function switchProfile() {
    await selectChild(null);
    navigate('/profiles');
  }
</script>

<div class="screen">
  <ChildBar />
  <h1 class="home-title">{theme.appTitle}</h1>
  <div class="banner">{theme.banner}</div>

  <div class="subjects">
    {#each subjects as { subject, count } (subject.id)}
      <button
        class="subject"
        style:--subject-color={subject.color}
        disabled={count === 0}
        onclick={() => navigate(`/subject/${subject.id}`)}
      >
        <span class="icon">{subject.icon}</span>
        <span class="name">{subject.title}</span>
        <span class="count">{count ? `${count} exercice${count > 1 ? 's' : ''}` : 'Bientôt !'}</span
        >
      </button>
    {/each}
  </div>

  {#if evaluations.length}
    <section class="homework">
      <h2>📋 Mon évaluation</h2>
      {#each evaluations as e (e.id)}
        <div class="assignment" class:done={e.completedAt !== null}>
          <div class="assignment-text">
            <strong>{e.title}</strong>
            <span class="due"
              >{e.completedAt !== null
                ? 'Finie, bravo !'
                : 'Une seule réponse par question, sans aide : comme en classe.'}</span
            >
            <span class="progress"><span style:width="{(e.answered / e.total) * 100}%"></span></span
            >
            <span class="count">{e.answered}/{e.total} questions</span>
          </div>
          {#if e.completedAt !== null}
            <span class="check">✅</span>
          {:else}
            <button class="btn success" onclick={() => navigate(`/evaluation/${e.id}`)}
              >{e.answered > 0 ? 'Continuer' : 'Commencer'}</button
            >
          {/if}
        </div>
      {/each}
    </section>
  {/if}

  {#if assignments.length}
    <section class="homework">
      <h2>📝 Mes devoirs</h2>
      {#each assignments as a (a.id)}
        <div class="assignment" class:done={a.completedAt !== null}>
          <div class="assignment-text">
            <strong>{a.title}</strong>
            <span
              class="due"
              class:late={a.completedAt === null && dueLabel(a.dueOn) === 'en retard'}
              >{a.completedAt !== null ? 'Fini, bravo !' : dueLabel(a.dueOn)}</span
            >
            <span class="progress"
              ><span style:width="{(a.answered / a.questions) * 100}%"></span></span
            >
            <span class="count"
              >{a.answered}/{a.questions} questions · +{HOMEWORK_BONUS}
              {theme.currency.icon} à la fin</span
            >
          </div>
          {#if a.completedAt !== null}
            <span class="check">✅</span>
          {:else}
            <button class="btn success" onclick={() => navigate(`/homework/${a.id}`)}
              >{a.answered > 0 ? 'Continuer' : 'Faire'}</button
            >
          {/if}
        </div>
      {/each}
    </section>
  {/if}

  <div class="daily" class:done={dailyDone}>
    <div class="daily-text">
      <strong>🎯 Défi du jour</strong>
      {#if dailyDone}
        <span>Réussi ! Reviens demain pour un nouveau défi.</span>
      {:else if daily && daily.answered > 0}
        <span>{daily.answered}/{DAILY_LENGTH} questions : continue !</span>
      {:else}
        <span
          >{DAILY_LENGTH} questions mélangées, +{DAILY_BONUS} {theme.currency.icon} à la fin</span
        >
      {/if}
      {#if daily}
        <span class="streak" class:off={daily.streak.current === 0}
          >🔥 {daily.streak.current} jour{daily.streak.current > 1 ? 's' : ''} de suite</span
        >
      {/if}
    </div>
    {#if dailyDone}
      <span class="check">✅</span>
    {:else}
      <button class="btn success" onclick={() => navigate('/daily')}
        >{daily && daily.answered > 0 ? 'Continuer' : 'C’est parti !'}</button
      >
    {/if}
  </div>

  <div class="actions">
    <button class="btn" onclick={() => navigate('/mix/all')}>🎲 Tout mélanger</button>
    {#if (session.childState?.mistakes ?? 0) > 0}
      <button class="btn accent" onclick={() => navigate('/review')}
        >🔁 Revoir mes erreurs ({session.childState?.mistakes})</button
      >
    {/if}
    {#if due.length}
      <button class="btn accent" onclick={() => navigate(`/mix?n=${due.join(',')}`)}
        >🧠 À réviser ({due.length} notion{due.length > 1 ? 's' : ''})</button
      >
    {/if}
  </div>

  <div class="actions">
    <button class="btn accent" onclick={() => navigate('/shop')}>🛍️ {theme.shopName}</button>
    <button class="btn" onclick={() => navigate('/collection')}>⭐ Ma collection</button>
    <button class="btn" onclick={() => navigate('/badges')}>🏅 Mes badges</button>
    <button class="btn" onclick={() => navigate('/themes')}>🎨 Ambiances</button>
  </div>
  <button class="btn ghost small" onclick={switchProfile}>Changer de profil</button>
</div>

<style>
  .home-title {
    font-size: 2rem;
    color: var(--primary);
    text-shadow: 2px 2px 0 var(--primary-soft);
    text-align: center;
    animation: bounce 2.5s infinite;
  }
  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
  .banner {
    font-size: 2.6rem;
  }
  .subjects {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    width: 100%;
  }
  .subject {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 22px 12px;
    border: none;
    border-radius: 24px;
    background: var(--surface);
    border-bottom: 6px solid var(--subject-color);
    box-shadow: var(--shadow);
    transition: transform 0.15s;
  }
  .subject:hover:not(:disabled) {
    transform: translateY(-4px);
  }
  .subject:disabled {
    opacity: 0.55;
    filter: grayscale(0.6);
  }
  .icon {
    font-size: 3rem;
  }
  .name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--subject-color);
  }
  .count {
    color: var(--text-soft);
    font-size: 0.95rem;
  }
  .homework {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .homework h2 {
    color: var(--primary-dark);
    font-size: 1.3rem;
  }
  .assignment {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 20px;
    background: var(--surface);
    border: 3px solid var(--primary-soft);
    box-shadow: var(--shadow);
  }
  .assignment.done {
    border-color: #66bb6a;
  }
  .assignment-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 200px;
  }
  .assignment-text strong {
    font-size: 1.15rem;
    color: var(--primary-dark);
  }
  .due {
    color: var(--text-soft);
  }
  .due.late {
    color: #c62828;
    font-weight: 700;
  }
  .progress {
    height: 10px;
    border-radius: 5px;
    background: #ece7f2;
    overflow: hidden;
  }
  .progress span {
    display: block;
    height: 100%;
    border-radius: 5px;
    background: var(--primary);
  }
  .count {
    font-size: 0.9rem;
    color: var(--text-soft);
  }
  .daily {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 16px 20px;
    border-radius: 24px;
    background: var(--surface);
    border: 3px solid var(--accent);
    box-shadow: var(--shadow);
  }
  .daily.done {
    border-color: #66bb6a;
  }
  .daily-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .daily-text strong {
    font-size: 1.3rem;
    color: var(--primary-dark);
  }
  .streak {
    font-weight: 700;
    color: var(--accent-dark);
  }
  .streak.off {
    color: var(--text-soft);
    font-weight: 400;
  }
  .check {
    font-size: 2.4rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
  }
</style>
