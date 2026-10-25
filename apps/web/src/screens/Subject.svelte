<script lang="ts">
  import { registry } from '@app/content';
  import { initialLevel } from '@app/core';
  import ChildBar from '../components/ChildBar.svelte';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, session } from '../lib/session.svelte';

  let { subjectId }: { subjectId: string } = $props();

  const subject = $derived(registry.subject(subjectId));
  const domains = $derived(
    registry
      .domainsOf(subjectId)
      .map((domain) => ({ domain, plugins: registry.pluginsOfDomain(domain.id) }))
      .filter((d) => d.plugins.length > 0),
  );

  function levelOf(pluginId: string): number {
    const plugin = registry.plugin(pluginId)!;
    const child = activeChild();
    return (
      session.childState?.levels[pluginId]?.level ?? (child ? initialLevel(plugin, child.grade) : 1)
    );
  }
</script>

<div class="screen">
  <ChildBar back={{ label: 'Accueil', onclick: () => navigate('/home') }} />

  {#if subject}
    <h1 class="title" style:color={subject.color}>{subject.icon} {subject.title}</h1>

    {#each domains as { domain, plugins } (domain.id)}
      <section class="domain">
        <h2>{domain.icon} {domain.title}</h2>
        <div class="exercises">
          {#each plugins as plugin (plugin.id)}
            {@const level = levelOf(plugin.id)}
            <button class="exercise" onclick={() => navigate(`/exercise/${plugin.id}`)}>
              <span class="icon">{plugin.icon ?? '📝'}</span>
              <span class="text">
                <span class="name">{plugin.title}</span>
                {#if plugin.description}<span class="desc">{plugin.description}</span>{/if}
                <span class="level">
                  Niveau {level}/{plugin.levels.length} · {plugin.levels[level - 1]?.label}
                </span>
              </span>
            </button>
          {/each}
        </div>
      </section>
    {:else}
      <div class="card">Les exercices de cette matière arrivent bientôt !</div>
    {/each}
  {:else}
    <div class="card">Matière inconnue.</div>
  {/if}
</div>

<style>
  .domain {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .domain h2 {
    color: var(--primary-dark);
    font-size: 1.3rem;
  }
  .exercises {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
  }
  .exercise {
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
    padding: 16px;
    border: none;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
    transition: transform 0.15s;
  }
  .exercise:hover {
    transform: translateY(-3px);
  }
  .icon {
    font-size: 2.4rem;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .name {
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--primary-dark);
  }
  .desc {
    color: var(--text-soft);
    font-size: 0.95rem;
  }
  .level {
    align-self: flex-start;
    background: var(--primary);
    color: white;
    border-radius: 10px;
    padding: 2px 10px;
    font-size: 0.85rem;
    font-weight: 700;
  }
</style>
