<script lang="ts">
  import { errorMessage } from '../lib/api';
  import { navigate } from '../lib/router.svelte';
  import { selectChild, session } from '../lib/session.svelte';

  let error = $state<string | null>(null);

  async function choose(childId: number) {
    try {
      await selectChild(childId);
      navigate('/home');
    } catch (e) {
      error = errorMessage(e);
    }
  }
</script>

<div class="screen">
  <h1 class="title">Qui travaille aujourd’hui ?</h1>
  {#if error}<p class="error-msg">{error}</p>{/if}

  {#if session.me?.children.length}
    <div class="profiles">
      {#each session.me.children as child (child.id)}
        <button class="profile" onclick={() => choose(child.id)}>
          <span class="avatar">{child.avatar}</span>
          <span class="name">{child.firstName}</span>
          <span class="grade">{child.grade}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="card empty">
      Aucun profil pour l’instant. Crée le profil de ton enfant dans l’espace parent.
    </div>
  {/if}

  <button class="btn ghost" onclick={() => navigate('/parent')}>🔒 Espace parent</button>
</div>

<style>
  .profiles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    margin: 16px 0;
  }
  .profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 160px;
    padding: 20px 12px;
    border: none;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
    transition: transform 0.15s;
  }
  .profile:hover {
    transform: translateY(-4px);
  }
  .avatar {
    font-size: 4rem;
  }
  .name {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .grade {
    color: var(--text-soft);
  }
  .empty {
    max-width: 420px;
    text-align: center;
  }
</style>
