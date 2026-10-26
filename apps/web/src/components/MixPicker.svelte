<script lang="ts">
  import { registry } from '@app/content';
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { masteryOf } from '../lib/notions';
  import { navigate } from '../lib/router.svelte';
  import { activeChild } from '../lib/session.svelte';
  import NotionBadge from './NotionBadge.svelte';

  /** Choisir les notions d'un mélange (toutes cochées au départ). */
  let { scope, onclose }: { scope: string; onclose: () => void } = $props();

  const notions = $derived(registry.notionsInScope(scope, activeChild()?.grade));
  const groups = $derived(
    registry.domains
      .map((domain) => ({ domain, notions: notions.filter((n) => n.domain === domain.id) }))
      .filter((g) => g.notions.length > 0),
  );
  const chosen = new SvelteSet<string>(
    untrack(() => registry.notionsInScope(scope).map((n) => n.id)),
  );

  function toggle(id: string) {
    if (chosen.has(id)) chosen.delete(id);
    else chosen.add(id);
  }

  function setAll(on: boolean) {
    for (const n of notions) {
      if (on) chosen.add(n.id);
      else chosen.delete(n.id);
    }
  }

  const selected = $derived(notions.filter((n) => chosen.has(n.id)).map((n) => n.id));
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div class="overlay" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="card picker" role="dialog" aria-modal="true" aria-label="Mélange">
    <h2>🎲 Je choisis ce que je mélange</h2>
    <div class="row">
      <button class="btn ghost small" onclick={() => setAll(true)}>Tout</button>
      <button class="btn ghost small" onclick={() => setAll(false)}>Rien</button>
    </div>
    {#each groups as { domain, notions: list } (domain.id)}
      <section>
        <h3>{domain.icon} {domain.title}</h3>
        {#each list as notion (notion.id)}
          <label class="notion">
            <input
              type="checkbox"
              checked={chosen.has(notion.id)}
              onchange={() => toggle(notion.id)}
            />
            <span class="name">{notion.title}</span>
            <NotionBadge mastery={masteryOf(notion.id)} />
          </label>
        {/each}
      </section>
    {/each}
    <div class="row">
      <button class="btn ghost" onclick={onclose}>Annuler</button>
      <button
        class="btn success"
        disabled={selected.length === 0}
        onclick={() => navigate(`/mix?n=${selected.join(',')}`)}
        >C’est parti ! (10 questions)</button
      >
    </div>
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
  .picker {
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: pop 0.25s;
  }
  h2 {
    color: var(--primary-dark);
    font-size: 1.3rem;
  }
  h3 {
    color: var(--primary);
    font-size: 1.05rem;
    margin-bottom: 6px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .notion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-radius: 12px;
    cursor: pointer;
  }
  .notion:hover {
    background: var(--primary-soft);
  }
  .notion input {
    width: 24px;
    height: 24px;
    accent-color: var(--primary);
    flex-shrink: 0;
  }
  .name {
    flex: 1;
    font-weight: 600;
  }
</style>
