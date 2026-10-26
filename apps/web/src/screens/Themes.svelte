<script lang="ts">
  import type { ThemeResponse } from '@app/core';
  import { getTheme, THEMES, type Theme } from '@app/themes';
  import ChildBar from '../components/ChildBar.svelte';
  import { api, errorMessage } from '../lib/api';
  import { confetti, toast } from '../lib/effects.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, session, setCoins } from '../lib/session.svelte';
  import { playSound } from '../lib/sounds';
  import { applyTheme } from '../lib/theme';

  const child = $derived(activeChild());
  const current = $derived(getTheme(child?.themeId));
  const unlocked = $derived(new Set(session.childState?.themes ?? []));
  /** Ambiance à payer, en attente du « oui » de l'enfant. */
  let confirming = $state<string | null>(null);
  let busy = $state(false);

  $effect(() => {
    if (!session.childState) void loadChildState();
  });

  const ownedCount = (theme: Theme) =>
    (session.childState?.owned ?? []).filter((o) => o.themeId === theme.id).length;

  async function choose(theme: Theme) {
    const paying = !unlocked.has(theme.id);
    busy = true;
    try {
      const res = await api.post<ThemeResponse>('child/theme', { themeId: theme.id });
      setCoins(res.coins);
      if (child) child.themeId = res.themeId;
      if (session.childState) {
        session.childState.themes = res.themes;
        session.childState.child.themeId = res.themeId;
      }
      applyTheme(res.themeId);
      if (paying) {
        confetti();
        playSound('coins');
        toast(`🎉 Bienvenue dans ${theme.name} !`);
      }
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      busy = false;
      confirming = null;
    }
  }
</script>

<div class="screen">
  <ChildBar back={{ label: 'Accueil', onclick: () => navigate('/home') }} />
  <h1 class="title">🎨 Mes ambiances</h1>
  <p class="intro">Choisis l’ambiance de ton cartable. Chacune a sa boutique et sa collection.</p>

  <div class="themes">
    {#each THEMES as theme (theme.id)}
      {@const isCurrent = theme.id === current.id}
      {@const isUnlocked = unlocked.has(theme.id)}
      <article
        class="theme"
        class:current={isCurrent}
        style:background={theme.colors.background}
        style:--theme-primary={theme.colors.primary}
      >
        <div class="banner">{theme.banner}</div>
        <h2 style:color={theme.colors.primary}>{theme.mascot} {theme.name}</h2>
        <p class="description">{theme.description}</p>
        <p class="meta">
          {theme.currency.icon} des {theme.currency.plural} · 🎁 {ownedCount(theme)}/{theme.rewards
            .length} récompenses
        </p>
        <div class="preview">
          {#each theme.rewards.slice(0, 6) as reward (reward.id)}<span>{reward.icon}</span>{/each}
        </div>
        {#if isCurrent}
          <span class="current-label">✓ Mon ambiance</span>
        {:else if isUnlocked}
          <button class="btn" disabled={busy} onclick={() => choose(theme)}>Choisir</button>
        {:else if confirming === theme.id}
          <p class="confirm">
            Dépenser {theme.unlockCost}
            {current.currency.icon} pour cette ambiance ?
          </p>
          <div class="row">
            <button class="btn ghost small" onclick={() => (confirming = null)}>Non</button>
            <button class="btn success small" disabled={busy} onclick={() => choose(theme)}
              >Oui !</button
            >
          </div>
        {:else}
          <button
            class="btn accent"
            disabled={busy || (child?.coins ?? 0) < theme.unlockCost}
            onclick={() => (confirming = theme.id)}
          >
            🔓 {theme.unlockCost}
            {current.currency.icon}
          </button>
          {#if (child?.coins ?? 0) < theme.unlockCost}
            <span class="missing"
              >Encore {theme.unlockCost - (child?.coins ?? 0)}
              {current.currency.plural} à gagner</span
            >
          {/if}
        {/if}
      </article>
    {/each}
  </div>
</div>

<style>
  .intro {
    color: var(--text-soft);
    text-align: center;
  }
  .themes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 16px;
    width: 100%;
  }
  .theme {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 18px 14px;
    border-radius: 24px;
    border: 4px solid transparent;
    box-shadow: var(--shadow);
    text-align: center;
  }
  .theme.current {
    border-color: var(--theme-primary);
  }
  .banner {
    font-size: 2.4rem;
  }
  h2 {
    font-size: 1.25rem;
  }
  .description,
  .meta {
    font-size: 0.95rem;
    color: #555;
  }
  .preview {
    display: flex;
    gap: 4px;
    font-size: 1.5rem;
  }
  .current-label {
    font-weight: 700;
    color: var(--theme-primary);
    padding: 10px;
  }
  .confirm {
    font-weight: 700;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .missing {
    font-size: 0.85rem;
    color: #777;
  }
</style>
