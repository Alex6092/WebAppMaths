<script lang="ts">
  import { onMount } from 'svelte';
  import type { InvitationPreview, MeResponse } from '@app/core';
  import { api, errorMessage } from '../lib/api';
  import { navigate, route } from '../lib/router.svelte';
  import { setMe } from '../lib/session.svelte';

  let code = $state(route.query.get('code') ?? '');
  /** Ce qu'ouvre le code : il change le titre et les champs (fiche parent, enseignant…). */
  let preview = $state<InvitationPreview | null>(null);
  const kind = $derived(preview?.kind ?? 'parent');
  const isSchool = $derived(kind === 'direction' || kind === 'enseignant');
  const pupil = $derived(preview?.pupil ?? null);

  async function check() {
    const value = code.trim();
    if (value.replace(/[^a-z0-9]/gi, '').length < 12) return;
    try {
      preview = await api.post<InvitationPreview>('auth/invitation', { code: value });
      error = null;
    } catch (e) {
      preview = null;
      error = errorMessage(e);
    }
  }

  const loginLink = $derived(`#/login?next=${encodeURIComponent(`/activer?code=${code.trim()}`)}`);
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
      navigate(isSchool ? '/ecole' : '/parent');
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
  <h1 class="title">
    {#if pupil}Activer le compte parent de {pupil.firstName}
    {:else if isSchool}Créer votre compte enseignant
    {:else}Créer le compte de la famille{/if}
  </h1>
  <form class="card form" onsubmit={submit}>
    {#if pupil}
      <p class="welcome">
        🏫 {pupil.firstName}{pupil.className ? ` · ${pupil.className}` : ''} · {preview?.schoolName}
      </p>
      <p class="hint">
        Avec ce compte, {pupil.firstName} pourra s’entraîner à la maison. Tu suivras ses progrès et les
        devoirs donnés par l’enseignant.
      </p>
      <a class="link" href={loginLink}>J’ai déjà un compte (un autre enfant dans l’app)</a>
    {:else if isSchool}
      <p class="welcome">🏫 {preview?.schoolName}</p>
    {/if}
    <div class="field">
      <label for="code">Code d’invitation</label>
      <input
        id="code"
        bind:value={code}
        onchange={check}
        placeholder="XXXX-XXXX-XXXX"
        autocomplete="off"
        required
      />
    </div>
    {#if !isSchool}
      <div class="field">
        <label for="family">Nom de la famille (facultatif)</label>
        <input id="family" bind:value={familyName} maxlength="60" placeholder="Famille Martin" />
      </div>
    {/if}
    <div class="field">
      <label for="email">{isSchool ? 'E-mail professionnel' : 'E-mail du parent'}</label>
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
    {#if pupil}
      <p class="privacy">
        🔒 {pupil.firstName} a un seul profil, partagé avec l’école : son enseignant voit sa progression,
        à l’école comme à la maison, et toi les devoirs et les évaluations de la classe. L’app ne garde
        que le prénom, l’avatar et la classe des enfants, et leurs réponses aux exercices.
      </p>
    {:else if isSchool}
      <p class="privacy">
        🔒 Les élèves n’ont ni e-mail ni mot de passe : seulement un prénom (et une initiale), un
        avatar, une classe et leurs réponses aux exercices.
      </p>
    {:else}
      <p class="privacy">
        🔒 L’app ne garde que le prénom, l’avatar et la classe des enfants, et leurs réponses aux
        exercices. Depuis l’espace parent, tu peux tout télécharger ou tout supprimer.
      </p>
    {/if}
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
  .privacy,
  .hint {
    color: var(--text-soft);
    font-size: 0.88rem;
  }
  .welcome {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .link {
    text-align: center;
    color: var(--primary);
    font-weight: 700;
  }
</style>
