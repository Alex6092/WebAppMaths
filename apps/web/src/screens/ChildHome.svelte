<script lang="ts">
  import { registry } from '@app/content';
  import { getTheme } from '@app/themes';
  import ChildBar from '../components/ChildBar.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, selectChild } from '../lib/session.svelte';

  const theme = $derived(getTheme(activeChild()?.themeId));
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

  <div class="actions">
    <button class="btn accent" onclick={() => navigate('/shop')}>🛍️ Boutique</button>
    <button class="btn" onclick={() => navigate('/collection')}>⭐ Ma collection</button>
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
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
  }
</style>
