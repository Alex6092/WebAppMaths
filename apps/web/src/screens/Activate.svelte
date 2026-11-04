<script lang="ts">
  import { onMount } from 'svelte';
  import type { InvitationPreview, MeResponse } from '@app/core';
  import { api, ApiError, errorMessage } from '../lib/api';
  import { navigate, route } from '../lib/router.svelte';
  import { isParentUnlocked, session, setMe } from '../lib/session.svelte';

  /**
   * Un compte connecté utilise un code : la fiche parent d'un élève (ajouter l'enfant à la
   * famille, ou le fusionner avec son profil existant), ou une invitation dans une école.
   */
  let code = $state(route.query.get('code') ?? '');
  let preview = $state<InvitationPreview | null>(null);
  let error = $state<string | null>(null);
  let busy = $state(false);
  /** Fiche parent : profil existant avec lequel fusionner (null : nouveau profil). */
  let mergeInto = $state<number | null>(null);
  let password = $state('');
  let needsPassword = $state(!isParentUnlocked());

  const pupil = $derived(preview?.pupil ?? null);
  // Seuls les profils pas encore inscrits dans une classe peuvent être fusionnés.
  const mergeable = $derived(session.me?.children.filter((c) => !c.classroom) ?? []);

  async function check(event?: SubmitEvent) {
    event?.preventDefault();
    error = null;
    preview = null;
    if (!code.trim()) return;
    try {
      preview = await api.post<InvitationPreview>('auth/invitation', { code: code.trim() });
      const same = mergeable.find(
        (c) => c.firstName.toLowerCase() === preview?.pupil?.firstName.toLowerCase(),
      );
      mergeInto = same?.id ?? null;
    } catch (e) {
      error = errorMessage(e);
    }
  }

  async function redeem(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    busy = true;
    try {
      if (needsPassword) {
        setMe(await api.post<MeResponse>('auth/unlock', { password }));
        password = '';
        needsPassword = false;
      }
      const me = await api.post<MeResponse>('auth/redeem', {
        code: code.trim(),
        ...(pupil && mergeInto !== null ? { mergeInto } : {}),
      });
      setMe(me);
      navigate(pupil ? '/parent' : '/ecole');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'parent_locked') needsPassword = true;
      error = errorMessage(e);
    } finally {
      busy = false;
    }
  }

  async function logout() {
    await api.post('auth/logout');
    setMe(null);
    navigate('/login');
  }

  onMount(() => {
    if (code) void check();
  });
</script>

<div class="screen center">
  <h1 class="title">
    {#if pupil}Ajouter {pupil.firstName} à ma famille
    {:else if preview && preview.kind !== 'eleve'}Rejoindre l’école
    {:else}J’ai un code{/if}
  </h1>

  {#if !preview}
    <form class="card form" onsubmit={check}>
      {#if !session.me?.family && !session.me?.schools.length}
        <p>Ce compte n’est rattaché à aucune famille ni à aucune école.</p>
      {/if}
      <p class="hint">
        Le code est sur la fiche donnée par l’école (sous le QR code), ou dans l’invitation reçue.
      </p>
      <div class="field">
        <label for="code">Code</label>
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
      <div class="row">
        {#if session.me?.family || session.me?.schools.length}
          <button class="btn ghost small" type="button" onclick={() => navigate('/')}
            >⬅️ Retour</button
          >
        {/if}
        <button class="btn ghost small" type="button" onclick={logout}>Se déconnecter</button>
      </div>
    </form>
  {:else}
    <form class="card form" onsubmit={redeem}>
      {#if pupil}
        <p class="welcome">
          🏫 {pupil.firstName}{pupil.className ? ` · ${pupil.className}` : ''} · {preview.schoolName}
        </p>
        {#if mergeable.length > 0}
          <fieldset>
            <legend>{pupil.firstName} a-t-il déjà un profil dans l’app ?</legend>
            <label
              ><input type="radio" bind:group={mergeInto} value={null} /> Non, créer son profil</label
            >
            {#each mergeable as child (child.id)}
              <label>
                <input type="radio" bind:group={mergeInto} value={child.id} />
                Oui : {child.avatar}
                {child.firstName} ({child.grade}) — on garde sa progression
              </label>
            {/each}
          </fieldset>
        {/if}
        <p class="hint">
          🔒 {pupil.firstName} aura un seul profil, partagé avec l’école : son enseignant verra sa progression,
          à l’école comme à la maison, et toi les devoirs et les évaluations de la classe.
        </p>
      {:else}
        <p class="welcome">🏫 {preview.schoolName}</p>
        <p class="hint">
          Ce compte ({session.me?.user.email}) rejoint l’école comme {preview.kind === 'direction'
            ? 'membre de la direction'
            : 'enseignant'}.
        </p>
      {/if}
      {#if needsPassword && session.me?.family}
        <div class="field">
          <label for="pw">Mot de passe du compte</label>
          <input
            id="pw"
            type="password"
            autocomplete="current-password"
            bind:value={password}
            required
          />
        </div>
      {/if}
      {#if error}<p class="error-msg">{error}</p>{/if}
      <button class="btn" type="submit" disabled={busy}>
        {pupil ? `Ajouter ${pupil.firstName}` : 'Rejoindre l’école'}
      </button>
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
    max-width: 460px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .welcome {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary-dark);
  }
  .hint {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 8px 12px 12px;
  }
  legend {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
</style>
