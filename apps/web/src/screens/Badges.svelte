<script lang="ts">
  import { registry } from '@app/content';
  import { collectionBadgeId, notionBadgeId, STATIC_BADGES } from '@app/core';
  import { THEMES } from '@app/themes';
  import ChildBar from '../components/ChildBar.svelte';
  import { describeBadge } from '../lib/badges';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, session } from '../lib/session.svelte';

  $effect(() => {
    if (!session.childState) void loadChildState();
  });

  const earned = $derived(
    new Map((session.childState?.badges ?? []).map((b) => [b.id, b.earnedAt])),
  );
  const daily = $derived(session.childState?.daily);
  /** Tous les badges à gagner, par famille, ceux déjà gagnés en couleur. */
  const groups = $derived([
    { title: '🎯 Défis et séries', ids: STATIC_BADGES.map((b) => b.id) },
    {
      title: '🏅 Notions acquises',
      ids: registry.notionsInScope('all', activeChild()?.grade).map((n) => notionBadgeId(n.id)),
    },
    { title: '👑 Collections complètes', ids: THEMES.map((t) => collectionBadgeId(t.id)) },
  ]);

  const dateOf = (ms: number) =>
    new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
</script>

<div class="screen">
  <ChildBar back={{ label: 'Accueil', onclick: () => navigate('/home') }} />
  <h1 class="title">🏅 Mes badges</h1>

  {#if daily}
    <div class="stats">
      <div class="stat"><span class="big">🔥 {daily.streak.current}</span>jours de suite</div>
      <div class="stat"><span class="big">🏆 {daily.streak.best}</span>ma meilleure série</div>
      <div class="stat"><span class="big">🎯 {daily.total}</span>défis réussis</div>
    </div>
  {/if}

  {#each groups as group (group.title)}
    <section>
      <h2>
        {group.title}
        <small>{group.ids.filter((id) => earned.has(id)).length}/{group.ids.length}</small>
      </h2>
      <div class="grid">
        {#each group.ids as id (id)}
          {@const badge = describeBadge(id)}
          {@const at = earned.get(id)}
          <div class="badge-card" class:earned={at !== undefined} title={badge.hint}>
            <span class="icon">{badge.icon}</span>
            <span class="name">{badge.title}</span>
            <span class="when">{at !== undefined ? `le ${dateOf(at)}` : badge.hint}</span>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: 18px;
    box-shadow: var(--shadow);
    color: var(--text-soft);
    font-size: 0.95rem;
  }
  .stat .big {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h2 {
    color: var(--primary-dark);
    font-size: 1.2rem;
  }
  h2 small {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .badge-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border-radius: 16px;
    background: var(--surface);
    border: 3px solid #e0e0e0;
    text-align: center;
  }
  .badge-card.earned {
    border-color: #ffd54f;
    box-shadow: 0 4px 14px rgba(255, 213, 79, 0.45);
  }
  .icon {
    font-size: 2.2rem;
  }
  .badge-card:not(.earned) .icon {
    filter: grayscale(1);
    opacity: 0.45;
  }
  .name {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--primary-dark);
  }
  .when {
    font-size: 0.78rem;
    color: var(--text-soft);
  }
</style>
