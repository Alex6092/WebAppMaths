<script lang="ts">
  import { registry } from '@app/content';
  import { initialLevel, newLevelState, type AnyPlugin, type ChildDto } from '@app/core';
  import { api } from '../../lib/api';
  import { toast } from '../../lib/effects.svelte';
  import { session } from '../../lib/session.svelte';

  /**
   * Le niveau de chaque exercice, matière par matière : le parent peut le changer (pour faire
   * redescendre un exercice trop dur) ; l'adaptation repart ensuite de ce niveau.
   */
  let { child, onerror }: { child: ChildDto; onerror: (e: unknown) => void } = $props();

  let open = $state(false);
  let subjectId = $state(registry.subjects[0]?.id ?? '');
  let levels = $state<Record<string, number>>({});

  $effect(() => {
    const id = child.id;
    if (!open) return;
    api.get<Record<string, number>>(`children/${id}/levels`).then((rows) => {
      if (id === child.id) levels = rows;
    }, onerror);
  });

  /** Les exercices de la matière, par domaine, pour la classe de l'enfant. */
  const domains = $derived(
    registry
      .domainsOf(subjectId)
      .map((domain) => ({
        domain,
        plugins: registry.pluginsOfNotions(
          registry.notionsInScope(domain.id, child.grade).map((n) => n.id),
        ),
      }))
      .filter((d) => d.plugins.length > 0),
  );

  const levelOf = (plugin: AnyPlugin) => levels[plugin.id] ?? initialLevel(plugin, child.grade);

  async function change(plugin: AnyPlugin, level: number) {
    try {
      const res = await api.put<{ level: number }>(`children/${child.id}/levels/${plugin.id}`, {
        level,
      });
      levels[plugin.id] = res.level;
      // Sur l'appareil de l'enfant, l'exercice reprend tout de suite à ce niveau.
      if (session.childState?.child.id === child.id)
        session.childState.levels[plugin.id] = newLevelState(res.level);
      toast(`${plugin.title} : niveau ${res.level} ✓`);
    } catch (e) {
      onerror(e);
    }
  }
</script>

{#if !open}
  <button class="btn small" onclick={() => (open = true)}>🎚️ Régler les niveaux</button>
{:else}
  <div class="panel">
    <p class="muted">
      L’app ajuste le niveau toute seule ; tu peux le changer ici si un exercice est trop dur ou
      trop facile pour {child.firstName}. Elle repartira de ce niveau.
    </p>
    <div class="subjects" role="tablist" aria-label="Matière">
      {#each registry.subjects as subject (subject.id)}
        <button
          class="subject"
          class:active={subject.id === subjectId}
          role="tab"
          aria-selected={subject.id === subjectId}
          onclick={() => (subjectId = subject.id)}>{subject.icon} {subject.title}</button
        >
      {/each}
    </div>
    {#each domains as { domain, plugins } (domain.id)}
      <p class="domain">{domain.icon} {domain.title}</p>
      <ul>
        {#each plugins as plugin (plugin.id)}
          {@const level = levelOf(plugin)}
          <li>
            <label for="lvl-{plugin.id}">
              {plugin.icon ?? '📝'}
              {plugin.title}
              {#if !(plugin.id in levels)}<span class="muted">(pas encore fait)</span>{/if}
            </label>
            <select
              id="lvl-{plugin.id}"
              value={level}
              onchange={(e) => change(plugin, Number(e.currentTarget.value))}
            >
              {#each plugin.levels as def, i (i)}
                <option value={i + 1}>Niveau {i + 1} · {def.label}</option>
              {/each}
            </select>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Pas d’exercice dans cette matière pour sa classe.</p>
    {/each}
    <button class="btn ghost small" onclick={() => (open = false)}>Fermer</button>
  </div>
{/if}

<style>
  .panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 2px dashed var(--primary-soft);
    padding-top: 12px;
  }
  .panel > .btn {
    align-self: flex-start;
  }
  .muted {
    color: var(--text-soft);
    font-size: 0.88rem;
    margin: 0;
  }
  .subjects {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .subject {
    border: 2px solid var(--primary-soft);
    background: var(--surface);
    border-radius: 999px;
    padding: 6px 12px;
    font-weight: 700;
  }
  .subject.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }
  .domain {
    font-weight: 700;
    font-size: 0.95rem;
    margin: 6px 0 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 4px 0;
    border-bottom: 1px solid #f0e8f6;
    font-size: 0.92rem;
  }
  label {
    flex: 1 1 220px;
  }
  select {
    flex: 0 0 300px;
    max-width: 100%;
    border: 2px solid var(--primary-soft);
    border-radius: 10px;
    padding: 6px 8px;
    background: white;
    min-height: 40px;
  }
</style>
