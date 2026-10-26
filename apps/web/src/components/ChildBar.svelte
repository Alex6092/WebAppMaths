<script lang="ts">
  import type { ChildDto } from '@app/core';
  import { getTheme } from '@app/themes';
  import type { Snippet } from 'svelte';
  import { api, errorMessage } from '../lib/api';
  import { toast } from '../lib/effects.svelte';
  import { activeChild, session } from '../lib/session.svelte';
  import { playSound } from '../lib/sounds';

  interface Props {
    back?: { label: string; onclick: () => void };
    children?: Snippet;
  }
  let { back, children }: Props = $props();

  const child = $derived(activeChild());
  const theme = $derived(getTheme(child?.themeId));

  async function toggleSound() {
    if (!child) return;
    try {
      const { sound } = await api.patch<ChildDto>('child/settings', { sound: !child.sound });
      child.sound = sound;
      if (session.childState) session.childState.child.sound = sound;
      if (sound) playSound('correct');
    } catch (error) {
      toast(errorMessage(error));
    }
  }
</script>

<header class="bar">
  {#if back}
    <button class="btn ghost small" onclick={back.onclick}>⬅️ {back.label}</button>
  {:else if child}
    <span class="who"><span class="avatar">{child.avatar}</span>{child.firstName}</span>
  {/if}
  <div class="middle">{@render children?.()}</div>
  {#if child}
    <button
      class="sound"
      onclick={toggleSound}
      aria-label={child.sound ? 'Couper les sons' : 'Remettre les sons'}
      title={child.sound ? 'Couper les sons' : 'Remettre les sons'}
      >{child.sound ? '🔔' : '🔕'}</button
    >
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
  .sound {
    border: none;
    background: none;
    font-size: 1.5rem;
    padding: 4px;
    line-height: 1;
  }
  .avatar {
    font-size: 1.8rem;
  }
</style>
