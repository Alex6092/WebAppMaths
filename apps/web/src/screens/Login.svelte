<script lang="ts">
  import type { MeResponse } from '@app/core';
  import { api, errorMessage } from '../lib/api';
  import { navigate } from '../lib/router.svelte';
  import { setMe } from '../lib/session.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    error = null;
    try {
      setMe(await api.post<MeResponse>('auth/login', { email, password }));
      navigate('/');
    } catch (e) {
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<div class="screen center">
  <div class="logo">🎒✨</div>
  <h1 class="title">Cartable magique</h1>
  <form class="card form" onsubmit={submit}>
    <p class="subtitle">Connexion des parents</p>
    <div class="field">
      <label for="email">E-mail</label>
      <input id="email" type="email" autocomplete="username" bind:value={email} required />
    </div>
    <div class="field">
      <label for="password">Mot de passe</label>
      <input
        id="password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        required
      />
    </div>
    {#if error}<p class="error-msg">{error}</p>{/if}
    <button class="btn" type="submit" disabled={busy}>Se connecter</button>
    <a class="link" href="#/register">J’ai un code d’invitation</a>
  </form>
</div>

<style>
  .center {
    justify-content: center;
  }
  .logo {
    font-size: 3.5rem;
  }
  .form {
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .link {
    text-align: center;
    color: var(--primary);
    font-weight: 700;
  }
</style>
