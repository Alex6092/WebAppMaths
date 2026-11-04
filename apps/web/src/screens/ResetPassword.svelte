<script lang="ts">
  import type { MeResponse, ResetPreview } from '@app/core';
  import { onMount } from 'svelte';
  import { api, errorMessage } from '../lib/api';
  import { navigate, route } from '../lib/router.svelte';
  import { setMe } from '../lib/session.svelte';

  /**
   * Mot de passe oublié : avec la fiche remise par l'école de l'enfant (ou le code donné par
   * l'administrateur), on choisit un nouveau mot de passe. Les autres appareils sont déconnectés.
   */
  let code = $state(route.query.get('code') ?? '');
  let preview = $state<ResetPreview | null>(null);
  let email = $state('');
  let password = $state('');
  let confirm = $state('');
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function check(event?: SubmitEvent) {
    event?.preventDefault();
    error = null;
    if (!code.trim()) return;
    try {
      preview = await api.post<ResetPreview>('auth/reset/preview', { code: code.trim() });
    } catch (e) {
      preview = null;
      error = errorMessage(e);
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    if (password !== confirm) {
      error = 'Les deux mots de passe ne sont pas identiques.';
      return;
    }
    busy = true;
    try {
      setMe(await api.post<MeResponse>('auth/reset', { code: code.trim(), email, password }));
      navigate('/');
    } catch (e) {
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    if (code) void check();
  });
</script>

<div class="screen center">
  <h1 class="title">Mot de passe oublié</h1>

  {#if !preview}
    <form class="card form" onsubmit={check}>
      <p>
        Demande à l’école de ton enfant une <strong>fiche de réinitialisation</strong> (ou un code à l’administrateur
        de l’app), puis scanne son QR code ou saisis son code ici.
      </p>
      <div class="field">
        <label for="code">Code de la fiche</label>
        <input
          id="code"
          bind:value={code}
          placeholder="XXXX-XXXX-XXXX"
          autocomplete="off"
          required
        />
      </div>
      {#if error}<p class="error-msg">{error}</p>{/if}
      <button class="btn" type="submit">Continuer</button>
      <a class="link" href="#/login">Retour à la connexion</a>
    </form>
  {:else}
    <form class="card form" onsubmit={submit}>
      {#if preview.pupil}
        <p class="welcome">
          🏫 Fiche de {preview.schoolName} pour un parent de {preview.pupil.firstName}
        </p>
      {/if}
      <div class="field">
        <label for="email">Ton e-mail (celui du compte)</label>
        <input id="email" type="email" autocomplete="username" bind:value={email} required />
      </div>
      <div class="field">
        <label for="password">Nouveau mot de passe (8 caractères minimum)</label>
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
        <label for="confirm">Nouveau mot de passe, encore une fois</label>
        <input
          id="confirm"
          type="password"
          autocomplete="new-password"
          bind:value={confirm}
          required
        />
      </div>
      <p class="hint">
        🔒 Les autres appareils connectés à ce compte seront déconnectés ; il faudra s’y reconnecter
        avec le nouveau mot de passe.
      </p>
      {#if error}<p class="error-msg">{error}</p>{/if}
      <button class="btn" type="submit" disabled={busy}>Changer le mot de passe</button>
      <button class="btn ghost small" type="button" onclick={() => (preview = null)}
        >Un autre code</button
      >
    </form>
  {/if}
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
  .welcome {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .hint {
    color: var(--text-soft);
    font-size: 0.88rem;
  }
  .link {
    text-align: center;
    color: var(--primary);
    font-weight: 700;
  }
</style>
