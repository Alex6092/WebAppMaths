<script lang="ts">
  import { getTheme, type Reward } from '@app/themes';
  import ChildBar from '../components/ChildBar.svelte';
  import { api, errorMessage } from '../lib/api';
  import { confetti, toast } from '../lib/effects.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, session, setCoins } from '../lib/session.svelte';

  /** Boutique (achat) ou collection (ce qui est déjà acquis). */
  let { mode }: { mode: 'shop' | 'collection' } = $props();

  const child = $derived(activeChild());
  const theme = $derived(getTheme(child?.themeId));
  const owned = $derived(
    new Set(
      (session.childState?.owned ?? [])
        .filter((o) => o.themeId === theme.id)
        .map((o) => o.rewardId),
    ),
  );
  const rewards = $derived(
    mode === 'shop' ? theme.rewards : theme.rewards.filter((r) => owned.has(r.id)),
  );
  let busy = $state(false);

  async function buy(reward: Reward) {
    busy = true;
    try {
      const { coins } = await api.post<{ coins: number }>('child/rewards', {
        themeId: theme.id,
        rewardId: reward.id,
      });
      setCoins(coins);
      session.childState?.owned.push({ themeId: theme.id, rewardId: reward.id });
      confetti();
      toast(`🎉 Tu as obtenu ${reward.icon} ${reward.name} !`);
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      busy = false;
    }
  }
</script>

<div class="screen">
  <ChildBar back={{ label: 'Accueil', onclick: () => navigate('/home') }} />
  <h1 class="title">{mode === 'shop' ? '🛍️ Boutique magique' : '⭐ Ma collection'}</h1>

  {#if rewards.length === 0}
    <div class="card empty">
      Tu n’as encore rien acheté…<br />Va à la boutique ! 🛍️
    </div>
  {/if}

  <div class="grid">
    {#each rewards as reward (reward.id)}
      {@const isOwned = owned.has(reward.id)}
      <div class="item" class:owned={isOwned}>
        <span class="icon">{reward.icon}</span>
        <span class="name">{reward.name}</span>
        {#if mode === 'shop'}
          {#if isOwned}
            <span class="owned-label">✓ Acquis !</span>
          {:else}
            <button
              class="btn accent small"
              disabled={busy || (child?.coins ?? 0) < reward.cost}
              onclick={() => buy(reward)}
            >
              {theme.currency.icon}
              {reward.cost}
            </button>
          {/if}
        {/if}
      </div>
    {/each}
  </div>

  <button class="btn" onclick={() => navigate(mode === 'shop' ? '/collection' : '/shop')}>
    {mode === 'shop' ? '⭐ Ma collection' : '🛍️ Boutique'}
  </button>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    width: 100%;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px;
    background: var(--surface);
    border-radius: 18px;
    border: 3px solid #e0e0e0;
    box-shadow: var(--shadow);
    text-align: center;
  }
  .item.owned {
    border-color: #ffd54f;
    box-shadow: 0 4px 16px rgba(255, 213, 79, 0.5);
  }
  .icon {
    font-size: 2.6rem;
    filter: grayscale(0.7);
  }
  .owned .icon {
    filter: none;
  }
  .name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .owned-label {
    color: var(--accent);
    font-weight: 700;
  }
  .empty {
    max-width: 380px;
    text-align: center;
    color: var(--text-soft);
  }
</style>
