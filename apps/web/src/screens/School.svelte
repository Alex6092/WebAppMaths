<script lang="ts">
  import {
    GRADE_IDS,
    type ClassroomDto,
    type CreatedInvitation,
    type GradeId,
    type MeResponse,
    type SchoolDto,
    type SchoolRole,
  } from '@app/core';
  import ClassPage from '../components/school/ClassPage.svelte';
  import { api, ApiError, errorMessage } from '../lib/api';
  import { toast } from '../lib/effects.svelte';
  import { navigate, route } from '../lib/router.svelte';
  import { isParentUnlocked, refreshMe, session, setMe } from '../lib/session.svelte';

  /**
   * Espace école : #/ecole/<école> (classes, équipe) et #/ecole/<école>/classe/<classe>.
   * La direction gère toute l'école ; l'enseignant, ses classes.
   */
  const schoolId = $derived(Number(route.segments[1]) || session.me?.schools[0]?.id || 0);
  const classId = $derived(route.segments[2] === 'classe' ? Number(route.segments[3]) : null);
  const tab = $derived(route.query.get('onglet') === 'equipe' ? 'equipe' : 'classes');

  let school = $state<SchoolDto | null>(null);
  let error = $state<string | null>(null);
  let unlocked = $state(isParentUnlocked());
  let password = $state('');

  function handle(e: unknown) {
    if (e instanceof ApiError && e.code === 'parent_locked') unlocked = false;
    error = errorMessage(e);
  }

  async function load() {
    try {
      school = await api.get<SchoolDto>(`schools/${schoolId}`);
      error = null;
    } catch (e) {
      handle(e);
    }
  }

  $effect(() => {
    if (unlocked && schoolId) void load();
  });

  async function unlock(event: SubmitEvent) {
    event.preventDefault();
    try {
      setMe(await api.post<MeResponse>('auth/unlock', { password }));
      password = '';
      unlocked = true;
      error = null;
    } catch (e) {
      handle(e);
    }
  }

  const isDirection = $derived(school?.role === 'direction');
  const emailOf = (userId: number) =>
    school?.members.find((m) => m.userId === userId)?.email ?? '?';
  const date = (ms: number) => new Date(ms).toLocaleDateString('fr-FR');
  const inviteLink = (code: string) =>
    `${location.origin}${location.pathname}#/activer?code=${code}`;

  // --- Nouvelle classe ---
  let className = $state('');
  let classGrades = $state<GradeId[]>(['CP']);

  async function addClass(event: SubmitEvent) {
    event.preventDefault();
    try {
      const created = await api.post<ClassroomDto>(`schools/${schoolId}/classes`, {
        name: className.trim(),
        grades: classGrades,
      });
      className = '';
      await Promise.all([load(), refreshMe()]);
      toast('Classe créée ✓');
      navigate(`/ecole/${schoolId}/classe/${created.id}`);
    } catch (e) {
      handle(e);
    }
  }

  function toggleGrade(grade: GradeId, on: boolean) {
    classGrades = on
      ? GRADE_IDS.filter((g) => g === grade || classGrades.includes(g))
      : classGrades.filter((g) => g !== grade);
  }

  // --- Équipe ---
  let inviteRole = $state<SchoolRole>('enseignant');
  let inviteNote = $state('');
  let invitation = $state<CreatedInvitation | null>(null);

  async function invite(event: SubmitEvent) {
    event.preventDefault();
    try {
      invitation = await api.post<CreatedInvitation>(`schools/${schoolId}/invitations`, {
        role: inviteRole,
        ...(inviteNote.trim() ? { note: inviteNote.trim() } : {}),
      });
      inviteNote = '';
      await load();
    } catch (e) {
      handle(e);
    }
  }

  async function revoke(id: number) {
    try {
      await api.del(`schools/${schoolId}/invitations/${id}`);
      await load();
    } catch (e) {
      handle(e);
    }
  }

  async function setRole(userId: number, role: SchoolRole) {
    try {
      school = await api.patch<SchoolDto>(`schools/${schoolId}/members/${userId}`, { role });
    } catch (e) {
      handle(e);
      await load();
    }
  }

  async function removeMember(userId: number) {
    if (
      !confirm(`Retirer ${emailOf(userId)} de l’école ? Son compte reste, sans accès aux classes.`)
    )
      return;
    try {
      await api.del(`schools/${schoolId}/members/${userId}`);
      await Promise.all([load(), refreshMe()]);
    } catch (e) {
      handle(e);
    }
  }

  async function logout() {
    await api.post('auth/logout');
    setMe(null);
    navigate('/login');
  }

  async function lock() {
    await api.post('auth/lock');
    await refreshMe();
    navigate('/');
  }
</script>

<div class="screen">
  <div class="top">
    {#if session.me?.family}
      <button class="btn ghost small" onclick={() => navigate('/')}>⬅️ Retour</button>
    {:else}
      <span></span>
    {/if}
    <h1 class="title">🏫 {school?.name ?? 'Espace école'}</h1>
    {#if (session.me?.schools.length ?? 0) > 1}
      <select
        aria-label="École"
        value={schoolId}
        onchange={(e) => navigate(`/ecole/${e.currentTarget.value}`)}
      >
        {#each session.me?.schools ?? [] as s (s.id)}<option value={s.id}>{s.name}</option>{/each}
      </select>
    {:else}
      <span></span>
    {/if}
  </div>

  {#if error}<p class="error-msg">{error}</p>{/if}

  {#if !unlocked}
    <form class="card narrow" onsubmit={unlock}>
      <p>Saisis ton mot de passe pour ouvrir l’espace école (10 minutes).</p>
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
  {:else if school && classId}
    {#key classId}
      <ClassPage {school} {classId} onerror={handle} onchange={load} />
    {/key}
  {:else if school}
    <nav class="tabs">
      <a href="#/ecole/{school.id}" class:active={tab === 'classes'}>Classes</a>
      <a href="#/ecole/{school.id}?onglet=equipe" class:active={tab === 'equipe'}>Équipe</a>
    </nav>

    {#if tab === 'classes'}
      <section class="card">
        <h2>Classes {school.classes[0] ? `· ${school.classes[0].schoolYear}` : ''}</h2>
        {#if school.classes.length === 0}
          <p class="muted">Pas encore de classe.</p>
        {:else}
          <div class="classes">
            {#each school.classes as c (c.id)}
              {@const mine = c.teacherIds.includes(session.me?.user.id ?? 0)}
              <a class="class" href="#/ecole/{school.id}/classe/{c.id}" class:mine>
                <strong>{c.name}</strong>
                <span>{c.grades.join('-')} · {c.pupils} élève{c.pupils > 1 ? 's' : ''}</span>
                <span class="muted small"
                  >{c.teacherIds.length
                    ? c.teacherIds.map(emailOf).join(', ')
                    : 'Pas d’enseignant'}</span
                >
              </a>
            {/each}
          </div>
        {/if}
        <form class="add" onsubmit={addClass}>
          <h3>Nouvelle classe</h3>
          <div class="row">
            <div class="field">
              <label for="class-name">Nom</label>
              <input
                id="class-name"
                bind:value={className}
                maxlength="40"
                placeholder="CE1 B"
                required
              />
            </div>
            <fieldset class="grades">
              <legend>Niveaux</legend>
              {#each GRADE_IDS as grade (grade)}
                <label
                  ><input
                    type="checkbox"
                    checked={classGrades.includes(grade)}
                    disabled={!classGrades.includes(grade) && classGrades.length >= 3}
                    onchange={(e) => toggleGrade(grade, e.currentTarget.checked)}
                  />
                  {grade}</label
                >
              {/each}
            </fieldset>
            <button class="btn small" type="submit" disabled={classGrades.length === 0}
              >Créer la classe</button
            >
          </div>
          {#if !isDirection}<p class="muted small">Tu seras l’enseignant de cette classe.</p>{/if}
        </form>
      </section>
    {:else}
      <section class="card">
        <h2>Équipe</h2>
        <table>
          <thead><tr><th>Compte</th><th>Rôle</th><th>Classes</th><th></th></tr></thead>
          <tbody>
            {#each school.members as m (m.userId)}
              <tr>
                <td>{m.email}{m.userId === session.me?.user.id ? ' (moi)' : ''}</td>
                <td>
                  {#if isDirection}
                    <select
                      aria-label="Rôle de {m.email}"
                      value={m.role}
                      onchange={(e) => setRole(m.userId, e.currentTarget.value as SchoolRole)}
                    >
                      <option value="direction">Direction</option>
                      <option value="enseignant">Enseignant</option>
                    </select>
                  {:else}
                    {m.role === 'direction' ? 'Direction' : 'Enseignant'}
                  {/if}
                </td>
                <td>
                  {school.classes
                    .filter((c) => m.classIds.includes(c.id))
                    .map((c) => c.name)
                    .join(', ') || '—'}
                </td>
                <td>
                  {#if isDirection && m.userId !== session.me?.user.id}
                    <button class="btn ghost small" onclick={() => removeMember(m.userId)}
                      >Retirer</button
                    >
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if isDirection}
          <form class="add" onsubmit={invite}>
            <h3>Inviter un enseignant</h3>
            <div class="row">
              <div class="field">
                <label for="invite-note">Pour qui ? (note)</label>
                <input
                  id="invite-note"
                  bind:value={inviteNote}
                  maxlength="100"
                  placeholder="Mme Martin, CE1"
                />
              </div>
              <div class="field small-field">
                <label for="invite-role">Rôle</label>
                <select id="invite-role" bind:value={inviteRole}>
                  <option value="enseignant">Enseignant</option>
                  <option value="direction">Direction</option>
                </select>
              </div>
              <button class="btn small" type="submit">Créer une invitation</button>
            </div>
          </form>
          {#if invitation}
            <p class="code">{invitation.code}</p>
            <p class="hint">
              Valable jusqu’au {date(invitation.expiresAt)} · lien : {inviteLink(invitation.code)}
            </p>
          {/if}
          {#if school.invitations.length}
            <h3>Invitations en attente</h3>
            <ul class="invitations">
              {#each school.invitations as inv (inv.id)}
                <li>
                  {inv.note ?? '—'} ({inv.role === 'direction' ? 'direction' : 'enseignant'}) ·
                  jusqu’au {date(inv.expiresAt)}
                  <button class="btn ghost small" onclick={() => revoke(inv.id)}>Retirer</button>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </section>
    {/if}
  {:else if !error}
    <p class="muted">Chargement…</p>
  {/if}

  <div class="row footer">
    {#if session.me?.family}
      <button class="btn ghost small" onclick={lock}>🔒 Verrouiller</button>
    {:else}
      <button class="btn ghost small" onclick={() => navigate('/activer')}>J’ai un code</button>
    {/if}
    <button class="btn ghost small" onclick={logout}>Se déconnecter</button>
  </div>
  <p class="version">{session.me?.user.email} · version {session.me?.version}</p>
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
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  .tabs a {
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--surface);
    color: var(--primary-dark);
    font-weight: 700;
    text-decoration: none;
    box-shadow: var(--shadow);
  }
  .tabs a.active {
    background: var(--primary);
    color: white;
  }
  .classes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }
  .class {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 2px solid var(--primary-soft);
    background: white;
    color: inherit;
    text-decoration: none;
  }
  .class.mine {
    border-color: var(--primary);
  }
  .class strong {
    font-size: 1.15rem;
    color: var(--primary-dark);
  }
  .add {
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    min-width: 160px;
  }
  .row .small-field {
    flex: 0 0 140px;
    min-width: 0;
  }
  .grades {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 6px 10px 8px;
  }
  .grades legend {
    font-weight: 700;
    color: var(--primary-dark);
    font-size: 0.9rem;
  }
  .grades label {
    display: flex;
    align-items: center;
    gap: 4px;
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
    overflow-wrap: anywhere;
  }
  .invitations {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
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
  .muted {
    color: var(--text-soft);
  }
  .small {
    font-size: 0.85rem;
  }
  .footer {
    justify-content: center;
    align-items: center;
  }
  .version {
    color: var(--text-soft);
    font-size: 0.85rem;
    text-align: center;
  }
</style>
