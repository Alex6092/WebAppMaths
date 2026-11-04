<script lang="ts">
  import { untrack } from 'svelte';
  import { registry } from '@app/content';
  import type { ClassroomDetail } from '@app/core';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';

  /**
   * Les notions de la classe : la leçon en cours (« En ce moment en classe », proposée aux élèves à
   * la maison) et les notions déjà vues (les seules de « Tout mélanger » et du défi du jour).
   */
  let {
    detail,
    onerror,
    onchange,
  }: {
    detail: ClassroomDetail;
    onerror: (e: unknown) => void;
    onchange: (next?: ClassroomDetail) => void;
  } = $props();

  const MAX_FOCUS = 12;

  /** Les notions des niveaux de la classe, par matière puis par domaine. */
  const subjects = $derived(
    registry.subjects
      .map((subject) => ({
        subject,
        domains: registry
          .domainsOf(subject.id)
          .map((domain) => {
            const ids = new Set(
              detail.grades.flatMap((g) => registry.notionsInScope(domain.id, g).map((n) => n.id)),
            );
            return { domain, notions: registry.notions.filter((n) => ids.has(n.id)) };
          })
          .filter((d) => d.notions.length > 0),
      }))
      .filter((s) => s.domains.length > 0),
  );
  const hasExercises = (id: string) => registry.pluginsOfNotions([id]).length > 0;

  let active = $state(untrack(() => new Set(detail.activeNotions)));
  let focus = $state(untrack(() => new Set(detail.focusNotions)));

  async function setSeen(notionIds: string[], on: boolean) {
    try {
      const res = await api.patch<{ activeNotions: string[] }>(`classes/${detail.id}/notions`, {
        notionIds,
        active: on,
      });
      active = new Set(res.activeNotions);
    } catch (e) {
      onerror(e);
    }
  }

  async function setFocus(id: string, on: boolean) {
    const next = on ? [...focus, id] : [...focus].filter((x) => x !== id);
    if (next.length > MAX_FOCUS) return;
    try {
      const updated = await api.patch<ClassroomDetail>(`classes/${detail.id}`, {
        focusNotions: registry.notions.filter((n) => next.includes(n.id)).map((n) => n.id),
      });
      focus = new Set(updated.focusNotions);
      onchange(updated);
      toast(on ? 'Ajoutée à la leçon en cours ✓' : 'Retirée de la leçon en cours');
      // Une notion de la leçon en cours est forcément vue en classe.
      if (on && !active.has(id)) await setSeen([id], true);
    } catch (e) {
      onerror(e);
    }
  }
</script>

<p class="muted">
  📌 = <strong>en ce moment en classe</strong> : les élèves la retrouvent en tête de leur page à la
  maison, et les parents la voient dans leur bilan. ☑️ = <strong>vue en classe</strong> : « Tout mélanger
  » et le défi du jour ne prennent que ces notions.
</p>

{#if focus.size > 0}
  <p class="focus">
    📌 En ce moment :
    {#each registry.notions.filter((n) => focus.has(n.id)) as n (n.id)}
      <span class="chip"
        >{n.title}
        <button
          class="unpin"
          aria-label="Retirer {n.title} de la leçon en cours"
          onclick={() => setFocus(n.id, false)}>✕</button
        ></span
      >
    {/each}
  </p>
{/if}

{#each subjects as { subject, domains } (subject.id)}
  <h3 style:color={subject.color}>{subject.icon} {subject.title}</h3>
  {#each domains as { domain, notions } (domain.id)}
    {@const ids = notions.map((n) => n.id)}
    <div class="domain">
      <p>{domain.icon} {domain.title}</p>
      <button class="btn ghost small" onclick={() => setSeen(ids, true)}>Tout cocher</button>
      <button class="btn ghost small" onclick={() => setSeen(ids, false)}>Tout décocher</button>
    </div>
    <ul>
      {#each notions as notion (notion.id)}
        <li>
          <input
            type="checkbox"
            checked={active.has(notion.id)}
            onchange={(e) => setSeen([notion.id], e.currentTarget.checked)}
            aria-label="{notion.title} : vue en classe"
          />
          <span title={notion.competence}>{notion.title}</span>
          {#if hasExercises(notion.id)}
            <button
              class="pin"
              class:on={focus.has(notion.id)}
              disabled={!focus.has(notion.id) && focus.size >= MAX_FOCUS}
              aria-pressed={focus.has(notion.id)}
              aria-label="{notion.title} : en ce moment en classe"
              title="En ce moment en classe"
              onclick={() => setFocus(notion.id, !focus.has(notion.id))}>📌</button
            >
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
{/each}

<style>
  .muted {
    color: var(--text-soft);
    font-size: 0.9rem;
  }
  h3 {
    font-size: 1.1rem;
    margin-top: 6px;
  }
  .domain {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .domain p {
    font-weight: 700;
    margin-right: auto;
  }
  ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 4px 14px;
  }
  li {
    display: grid;
    grid-template-columns: 22px 1fr auto;
    align-items: center;
    gap: 8px;
    font-size: 0.92rem;
  }
  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }
  .pin {
    border: none;
    background: none;
    font-size: 1rem;
    opacity: 0.25;
    filter: grayscale(1);
    padding: 2px 4px;
  }
  .pin.on {
    opacity: 1;
    filter: none;
  }
  .focus {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 4px 2px 10px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary-dark);
    font-weight: 400;
  }
  .unpin {
    border: none;
    background: none;
    color: inherit;
    padding: 0 4px;
  }
</style>
