<script lang="ts">
  import type { MeResponse } from '@app/core';
  import { api, errorMessage } from '../lib/api';
  import { navigate, route } from '../lib/router.svelte';
  import { setMe } from '../lib/session.svelte';

  let code = $state(route.query.get('code') ?? '');
  let familyName = $state('');
  let email = $state('');
  let password = $state('');
  let confirm = $state('');
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    if (password !== confirm) {
      error = 'Les deux mots de passe ne sont pas identiques.';
      return;
    }
    busy = true;
    try {
      const body = {
        code: code.trim(),
        email,
        password,
        ...(familyName.trim() ? { familyName: familyName.trim() } : {}),
      };
      setMe(await api.post<MeResponse>('auth/register', body));
      navigate('/parent');
    } catch (e) {
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }
</script>

<div class="screen center">
  <h1 class="title">Créer le compte de la famille</h1>
  <form class="card form" onsubmit={submit}>
    <div class="field">
      <label for="code">Code d’invitation</label>
      <input id="code" bind:value={code} placeholder="XXXX-XXXX-XXXX" autocomplete="off" required />
    </div>
    <div class="field">
      <label for="family">Nom de la famille (facultatif)</label>
      <input id="family" bind:value={familyName} maxlength="60" placeholder="Famille Martin" />
    </div>
    <div class="field">
      <label for="email">E-mail du parent</label>
      <input id="email" type="email" autocomplete="username" bind:value={email} required />
    </div>
    <div class="field">
      <label for="password">Mot de passe (8 caractères minimum)</label>
      <input
        id="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        bind:value={password}
        required
      />
    </div>
    <div class="field">
      <label for="confirm">Mot de passe, encore une fois</label>
      <input
        id="confirm"
        type="password"
        autocomplete="new-password"
        bind:value={confirm}
        required
      />
    </div>
    {#if error}<p class="error-msg">{error}</p>{/if}
    <button class="btn" type="submit" disabled={busy}>Créer le compte</button>
    <a class="link" href="#/login">J’ai déjà un compte</a>
  </form>
</div>

<style>
  .center {
    justify-content: center;
  }
  .form {
    max-width: 420px;
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
