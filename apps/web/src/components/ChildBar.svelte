<script lang="ts">
  import { getTheme } from '@app/themes';
  import type { Snippet } from 'svelte';
  import { activeChild } from '../lib/session.svelte';

  interface Props {
    back?: { label: string; onclick: () => void };
    children?: Snippet;
  }
  let { back, children }: Props = $props();

  const child = $derived(activeChild());
  const theme = $derived(getTheme(child?.themeId));
</script>

<header class="bar">
  {#if back}
    <button class="btn ghost small" onclick={back.onclick}>⬅️ {back.label}</button>
  {:else if child}
    <span class="who"><span class="avatar">{child.avatar}</span>{child.firstName}</span>
  {/if}
  <div class="middle">{@render children?.()}</div>
  {#if child}
    <span class="badge coins" aria-label="{child.coins} {theme.currency.plural}">
      {theme.currency.icon}
      {child.coins}
    </span>
  {/if}
</header>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
  }
  .middle {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 1.1rem;
  }
  .avatar {
    font-size: 1.8rem;
  }
</style>
