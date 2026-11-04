<script lang="ts">
  import {
    AVATARS,
    dayKey,
    GRADE_IDS,
    type AdminSchoolDto,
    type ChildDto,
    type CreatedInvitation,
    type GradeId,
    type InvitationDto,
    type MeResponse,
  } from '@app/core';
  import ChildReport from '../components/parent/ChildReport.svelte';
  import Evaluations from '../components/parent/Evaluations.svelte';
  import Homework from '../components/parent/Homework.svelte';
  import InstallHelp from '../components/parent/InstallHelp.svelte';
  import Levels from '../components/parent/Levels.svelte';
  import Worksheets from '../components/parent/Worksheets.svelte';
  import { api, ApiError, errorMessage } from '../lib/api';
  import { toast } from '../lib/effects.svelte';
  import { navigate } from '../lib/router.svelte';
  import { isParentUnlocked, refreshMe, session, setMe } from '../lib/session.svelte';

  let password = $state('');
  let error = $state<string | null>(null);
  let unlocked = $state(isParentUnlocked());

  // Formulaire d'ajout ou de modification d'un profil.
  let editing = $state<ChildDto | null>(null);
  let form = $state({
    firstName: '',
    avatar: AVATARS[0] as string,
    grade: 'CE1' as GradeId,
    coins: 0,
  });

  let familyCode = $state<CreatedInvitation | null>(null);
  let invitations = $state<InvitationDto[]>([]);
  let newInvitation = $state<CreatedInvitation | null>(null);
  let invitationNote = $state('');

  const isAdmin = $derived(session.me?.user.role === 'admin');
  // Enfant dont on regarde le bilan (le premier par défaut).
  let followedId = $state<number | null>(null);
  const followed = $derived(
    session.me?.children.find((c) => c.id === followedId) ?? session.me?.children[0] ?? null,
  );

  $effect(() => {
    if (unlocked && isAdmin) {
      void loadInvitations();
      void loadSchools();
    }
  });

  // --- Administration : écoles ---
  let schools = $state<AdminSchoolDto[]>([]);
  let schoolName = $state('');
  let schoolCity = $state('');
  let schoolCode = $state<{ school: string; invitation: CreatedInvitation } | null>(null);

  async function loadSchools() {
    try {
      schools = await api.get<AdminSchoolDto[]>('admin/schools');
    } catch (e) {
      handle(e);
    }
  }

  async function createSchool(event: SubmitEvent) {
    event.preventDefault();
    try {
      const created = await api.post<{ id: number; invitation: CreatedInvitation }>(
        'admin/schools',
        { name: schoolName.trim(), ...(schoolCity.trim() ? { city: schoolCity.trim() } : {}) },
      );
      schoolCode = { school: schoolName.trim(), invitation: created.invitation };
      schoolName = '';
      schoolCity = '';
      await loadSchools();
    } catch (e) {
      handle(e);
    }
  }

  async function directionCode(school: AdminSchoolDto) {
    try {
      schoolCode = {
        school: school.name,
        invitation: await api.post<CreatedInvitation>(`admin/schools/${school.id}/invitations`),
      };
    } catch (e) {
      handle(e);
    }
  }

  async function deleteSchool(school: AdminSchoolDto) {
    if (
      !confirm(
        `Supprimer l’école ${school.name} ? Ses classes disparaissent ; les élèves sans famille sont supprimés, les autres restent à leur famille.`,
      )
    )
      return;
    try {
      await api.del(`admin/schools/${school.id}`);
      await Promise.all([loadSchools(), refreshMe()]);
    } catch (e) {
      handle(e);
    }
  }

  // --- Fiche de l'école ---
  let pupilCode = $state('');

  /** Toute erreur « parent_locked » ramène au formulaire de mot de passe. */
  function handle(e: unknown) {
    if (e instanceof ApiError && e.code === 'parent_locked') unlocked = false;
    error = errorMessage(e);
  }

  async function unlock(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    try {
      setMe(await api.post<MeResponse>('auth/unlock', { password }));
      password = '';
      unlocked = true;
    } catch (e) {
      handle(e);
    }
  }

  function startEdit(child: ChildDto | null) {
    editing = child;
    form = child
      ? { firstName: child.firstName, avatar: child.avatar, grade: child.grade, coins: child.coins }
      : { firstName: '', avatar: AVATARS[0], grade: 'CE1', coins: 0 };
  }

  async function saveChild(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    try {
      if (editing)
        await api.patch(`children/${editing.id}`, {
          firstName: form.firstName,
          avatar: form.avatar,
          coins: form.coins,
          // L'école règle la classe d'un élève inscrit.
          ...(editing.classroom ? {} : { grade: form.grade }),
        });
      else
        await api.post('children', {
          firstName: form.firstName,
          avatar: form.avatar,
          grade: form.grade,
        });
      await refreshMe();
      toast(editing ? 'Profil modifié ✓' : 'Profil créé ✓');
      startEdit(null);
    } catch (e) {
      handle(e);
    }
  }

  async function removeChild(child: ChildDto) {
    const message = child.classroom
      ? `Retirer ${child.firstName} de la famille ? ${child.firstName} reste élève de ${child.classroom.name} : son profil et sa progression restent à l’école.`
      : `Supprimer le profil de ${child.firstName} et toute sa progression ?`;
    if (!confirm(message)) return;
    try {
      await api.del(`children/${child.id}`);
      await refreshMe();
      startEdit(null);
    } catch (e) {
      handle(e);
    }
  }

  async function inviteParent() {
    try {
      familyCode = await api.post<CreatedInvitation>('family/invitations');
    } catch (e) {
      handle(e);
    }
  }

  async function loadInvitations() {
    try {
      invitations = await api.get<InvitationDto[]>('admin/invitations');
    } catch (e) {
      handle(e);
    }
  }

  async function createInvitation() {
    try {
      newInvitation = await api.post<CreatedInvitation>('admin/invitations', {
        ...(invitationNote.trim() ? { note: invitationNote.trim() } : {}),
      });
      invitationNote = '';
      await loadInvitations();
    } catch (e) {
      handle(e);
    }
  }

  async function revoke(id: number) {
    try {
      await api.del(`admin/invitations/${id}`);
      await loadInvitations();
    } catch (e) {
      handle(e);
    }
  }

  let exporting = $state(false);
  let deleteOpen = $state(false);
  let deletePassword = $state('');

  /** Télécharge toutes les données de la famille (JSON). */
  async function exportData() {
    exporting = true;
    try {
      const data = await api.get<unknown>('family/export');
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `cartable-magique-${dayKey(new Date())}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      handle(e);
    } finally {
      exporting = false;
    }
  }

  async function deleteFamily(event: SubmitEvent) {
    event.preventDefault();
    if (
      !confirm(
        'Supprimer définitivement la famille, les comptes parents et toute la progression des enfants ?',
      )
    )
      return;
    error = null;
    try {
      await api.del('family', { password: deletePassword });
      setMe(null);
      navigate('/login');
      toast('Les données de la famille ont été supprimées.');
    } catch (e) {
      handle(e);
    } finally {
      deletePassword = '';
    }
  }

  async function lock() {
    await api.post('auth/lock');
    await refreshMe();
    navigate('/');
  }

  async function logout() {
    await api.post('auth/logout');
    setMe(null);
    navigate('/login');
  }

  const date = (ms: number) => new Date(ms).toLocaleDateString('fr-FR');
  const inviteLink = (code: string) =>
    `${location.origin}${location.pathname}#/register?code=${code}`;
  const activateLink = (code: string) =>
    `${location.origin}${location.pathname}#/activer?code=${code}`;
</script>

<div class="screen">
  <div class="top">
    <button class="btn ghost small" onclick={() => navigate('/')}>⬅️ Retour</button>
    <h1 class="title">Espace parent</h1>
    <span></span>
  </div>

  {#if error}<p class="error-msg">{error}</p>{/if}

  {#if !unlocked}
    <form class="card narrow" onsubmit={unlock}>
      <p>Saisis ton mot de passe pour ouvrir l’espace parent (10 minutes).</p>
      <div class="field">
        <label for="pw">Mot de passe</label>
        <input
          id="pw"
          type="password"
          autocomplete="current-password"
          bind:value={password}
          required
        />
      </div>
      <button class="btn" type="submit">Déverrouiller</button>
    </form>
  {:else}
    {#if followed}
      <section class="card">
        <h2>📊 Suivi</h2>
        {#if (session.me?.children.length ?? 0) > 1}
          <div class="children">
            {#each session.me?.children ?? [] as child (child.id)}
              <button
                class="child"
                class:active={followed.id === child.id}
                onclick={() => (followedId = child.id)}
              >
                <span class="avatar">{child.avatar}</span><strong>{child.firstName}</strong>
              </button>
            {/each}
          </div>
        {/if}
        <h3>📝 Devoirs</h3>
        <Homework child={followed} onerror={handle} />
        <h3>📋 Évaluations blanches</h3>
        <Evaluations child={followed} onerror={handle} />
        <h3>🖨️ Fiches à imprimer</h3>
        <Worksheets child={followed} onerror={handle} />
        <h3>🎚️ Niveaux des exercices</h3>
        <Levels child={followed} onerror={handle} />
        <ChildReport childId={followed.id} onerror={handle} />
      </section>
    {/if}

    <section class="card">
      <h2>Profils des enfants</h2>
      <div class="children">
        {#each session.me?.children ?? [] as child (child.id)}
          <button
            class="child"
            class:active={editing?.id === child.id}
            onclick={() => startEdit(child)}
          >
            <span class="avatar">{child.avatar}</span>
            <span
              ><strong>{child.firstName}</strong><br />{child.grade} · 💰 {child.coins}{#if child.classroom}<br
                /><span class="school">🏫 {child.classroom.name}</span>{/if}</span
            >
          </button>
        {/each}
        <button class="child add" class:active={editing === null} onclick={() => startEdit(null)}>
          <span class="avatar">➕</span><span>Ajouter</span>
        </button>
      </div>

      <form class="child-form" onsubmit={saveChild}>
        <h3>{editing ? `Modifier ${editing.firstName}` : 'Nouveau profil'}</h3>
        <div class="row">
          <div class="field">
            <label for="name">Prénom</label>
            <input id="name" bind:value={form.firstName} maxlength="30" required />
          </div>
          <div class="field">
            <label for="grade">Classe</label>
            <select id="grade" bind:value={form.grade} disabled={!!editing?.classroom}>
              {#each GRADE_IDS as grade (grade)}<option value={grade}>{grade}</option>{/each}
            </select>
          </div>
          {#if editing}
            <div class="field">
              <label for="coins">Pièces</label>
              <input id="coins" type="number" min="0" max="100000" bind:value={form.coins} />
            </div>
          {/if}
        </div>
        {#if editing?.classroom}
          <p class="hint">
            🏫 Élève de {editing.classroom.name} · {editing.classroom.schoolName} : l’école règle sa classe,
            les notions vues et lui donne des devoirs ; son enseignant voit sa progression.
          </p>
        {/if}
        <div class="avatars" role="radiogroup" aria-label="Avatar">
          {#each AVATARS as avatar (avatar)}
            <button
              type="button"
              class="avatar-choice"
              class:selected={form.avatar === avatar}
              role="radio"
              aria-checked={form.avatar === avatar}
              onclick={() => (form.avatar = avatar)}>{avatar}</button
            >
          {/each}
        </div>
        <div class="row">
          <button class="btn" type="submit">{editing ? 'Enregistrer' : 'Créer le profil'}</button>
          {#if editing}
            <button class="btn danger" type="button" onclick={() => editing && removeChild(editing)}
              >{editing.classroom ? 'Retirer de la famille' : 'Supprimer'}</button
            >
          {/if}
        </div>
      </form>
    </section>

    <section class="card">
      <h2>🏫 Fiche de l’école</h2>
      <p>
        L’école de ton enfant t’a donné une fiche avec un QR code ? Scanne-la, ou saisis son code
        ici : l’enfant rejoint ton compte (avec ses frères et sœurs).
      </p>
      <form
        class="row"
        onsubmit={(e) => {
          e.preventDefault();
          navigate(`/activer?code=${encodeURIComponent(pupilCode.trim())}`);
        }}
      >
        <div class="field">
          <label for="pupil-code">Code de la fiche</label>
          <input
            id="pupil-code"
            bind:value={pupilCode}
            placeholder="XXXX-XXXX-XXXX"
            autocomplete="off"
            required
          />
        </div>
        <button class="btn small" type="submit">Continuer</button>
      </form>
      {#if session.me?.schools.length}
        <button class="btn ghost small" onclick={() => navigate('/ecole')}>🏫 Espace école</button>
      {/if}
    </section>

    <section class="card">
      <h2>Second parent</h2>
      <p>Crée un code pour qu’un autre parent rejoigne la famille avec son propre compte.</p>
      <button class="btn small" onclick={inviteParent}>Créer un code</button>
      {#if familyCode}
        <p class="code">{familyCode.code}</p>
        <p class="hint">
          Valable jusqu’au {date(familyCode.expiresAt)} · lien : {inviteLink(familyCode.code)}
        </p>
      {/if}
    </section>

    <InstallHelp />

    <section class="card">
      <h2>🔒 Données de la famille</h2>
      <p>
        L’app garde le strict nécessaire : le nom de la famille, l’e-mail des parents et leur mot de
        passe (chiffré) ; pour chaque enfant, son prénom, son avatar, sa classe et ses réponses aux
        exercices, qui servent à suivre ses progrès. Il n’y a ni publicité ni pisteur, et rien n’est
        transmis à personne.
      </p>
      <p class="hint">
        {#if isAdmin}
          Tu peux télécharger toutes ces données (fichier JSON). La famille de l’administrateur ne
          se supprime pas depuis l’app.
        {:else}
          Tu peux télécharger toutes ces données (fichier JSON), ou tout supprimer. Après une
          suppression, les copies de sauvegarde du serveur disparaissent d’elles-mêmes en 14 jours.
        {/if}
      </p>
      <div class="row">
        <button class="btn small" disabled={exporting} onclick={exportData}
          >⬇️ Télécharger nos données</button
        >
        {#if !isAdmin && !deleteOpen}
          <button class="btn danger small" onclick={() => (deleteOpen = true)}
            >Supprimer la famille…</button
          >
        {/if}
      </div>
      {#if deleteOpen}
        <form class="delete-form" onsubmit={deleteFamily}>
          <p>
            <strong>Attention :</strong> les comptes parents, les profils des enfants et toute leur progression
            seront effacés. C’est définitif.
          </p>
          <div class="row">
            <div class="field">
              <label for="delete-pw">Mot de passe pour confirmer</label>
              <input
                id="delete-pw"
                type="password"
                autocomplete="current-password"
                bind:value={deletePassword}
                required
              />
            </div>
            <button class="btn ghost small" type="button" onclick={() => (deleteOpen = false)}
              >Annuler</button
            >
            <button class="btn danger small" type="submit">Tout supprimer</button>
          </div>
        </form>
      {/if}
    </section>

    {#if isAdmin}
      <section class="card">
        <h2>Administration : inviter une famille</h2>
        <div class="row">
          <div class="field">
            <label for="note">Pour qui ? (note)</label>
            <input
              id="note"
              bind:value={invitationNote}
              maxlength="100"
              placeholder="Famille de Julie (collègue)"
            />
          </div>
          <button class="btn small" onclick={createInvitation}>Créer une invitation</button>
        </div>
        {#if newInvitation}
          <p class="code">{newInvitation.code}</p>
          <p class="hint">À transmettre : {inviteLink(newInvitation.code)}</p>
        {/if}
        <table>
          <thead><tr><th>Note</th><th>Créée</th><th>État</th><th></th></tr></thead>
          <tbody>
            {#each invitations as inv (inv.id)}
              <tr>
                <td>{inv.note ?? '—'}{inv.role === 'admin' ? ' (admin)' : ''}</td>
                <td>{date(inv.createdAt)}</td>
                <td>
                  {#if inv.usedAt}Utilisée par {inv.usedByEmail ?? '?'}
                  {:else if inv.expiresAt < Date.now()}Expirée
                  {:else}En attente (jusqu’au {date(inv.expiresAt)}){/if}
                </td>
                <td>
                  {#if !inv.usedAt}<button class="btn ghost small" onclick={() => revoke(inv.id)}
                      >Retirer</button
                    >{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Administration : écoles</h2>
        <form class="row" onsubmit={createSchool}>
          <div class="field">
            <label for="school-name">Nom de l’école</label>
            <input
              id="school-name"
              bind:value={schoolName}
              maxlength="80"
              placeholder="École des Tilleuls"
              required
            />
          </div>
          <div class="field">
            <label for="school-city">Ville (facultatif)</label>
            <input id="school-city" bind:value={schoolCity} maxlength="80" />
          </div>
          <button class="btn small" type="submit">Créer l’école</button>
        </form>
        {#if schoolCode}
          <p>Code de la direction de {schoolCode.school} :</p>
          <p class="code">{schoolCode.invitation.code}</p>
          <p class="hint">
            Valable jusqu’au {date(schoolCode.invitation.expiresAt)} · lien : {activateLink(
              schoolCode.invitation.code,
            )}
          </p>
        {/if}
        {#if schools.length}
          <table>
            <thead
              ><tr><th>École</th><th>Équipe</th><th>Classes</th><th>Élèves</th><th></th></tr></thead
            >
            <tbody>
              {#each schools as school (school.id)}
                <tr>
                  <td>{school.name}{school.city ? ` (${school.city})` : ''}</td>
                  <td>{school.members}</td>
                  <td>{school.classes}</td>
                  <td>{school.pupils}</td>
                  <td>
                    <button class="btn ghost small" onclick={() => directionCode(school)}
                      >Code direction</button
                    >
                    <button class="btn ghost small" onclick={() => deleteSchool(school)}
                      >Supprimer</button
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    {/if}

    <div class="row footer">
      <button class="btn ghost small" onclick={lock}>🔒 Verrouiller</button>
      <button class="btn ghost small" onclick={logout}>Se déconnecter</button>
      {#if isAdmin}<a class="link" href="#/dev/gallery">Galerie des exercices</a>{/if}
    </div>
  {/if}
  <p class="version">
    {session.me?.family?.name} · {session.me?.user.email} · version {session.me?.version}
  </p>
</div>

<style>
  .top {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    width: 100%;
    gap: 8px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  section > .btn {
    align-self: flex-start;
  }
  h2 {
    color: var(--primary);
    font-size: 1.25rem;
  }
  h3 {
    color: var(--primary-dark);
  }
  .narrow {
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .children {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .child {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 14px;
    border: 2px solid var(--primary-soft);
    background: white;
    text-align: left;
  }
  .child.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }
  .child .avatar {
    font-size: 2rem;
  }
  .child .school {
    color: var(--text-soft);
    font-size: 0.85rem;
  }
  .child-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }
  .row .field {
    flex: 1;
    min-width: 140px;
  }
  .avatars {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .avatar-choice {
    font-size: 1.8rem;
    width: 52px;
    height: 52px;
    border-radius: 12px;
    border: 2px solid transparent;
    background: #f5f5f5;
  }
  .avatar-choice.selected {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
  .code {
    font-family: ui-monospace, monospace;
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--primary-dark);
    user-select: all;
  }
  .hint {
    color: var(--text-soft);
    font-size: 0.9rem;
    word-break: break-all;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  th,
  td {
    text-align: left;
    padding: 6px 4px;
    border-bottom: 1px solid #eee;
  }
  .delete-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 2px solid #ef9a9a;
    border-radius: 14px;
    padding: 12px;
    background: #fff5f5;
  }
  .footer {
    justify-content: center;
    align-items: center;
  }
  .link {
    color: var(--primary);
    font-weight: 700;
  }
  .version {
    color: var(--text-soft);
    font-size: 0.85rem;
    text-align: center;
  }
</style>
