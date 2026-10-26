<script lang="ts">
  import { registry } from '@app/content';
  import { DAILY_BONUS, DAILY_LENGTH } from '@app/core';
  import { getTheme } from '@app/themes';
  import ChildBar from '../components/ChildBar.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, selectChild, session } from '../lib/session.svelte';

  const theme = $derived(getTheme(activeChild()?.themeId));
  const daily = $derived(session.childState?.daily);
  const dailyDone = $derived(daily?.streak.doneToday ?? false);

  // Le défi du jour et la série viennent de l'état de l'enfant.
  $effect(() => {
    if (!session.childState) void loadChildState();
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

  <button class="btn" onclick={() => navigate('/mix/all')}>🎲 Tout mélanger</button>

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
