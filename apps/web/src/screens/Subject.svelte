<script lang="ts">
  import { registry } from '@app/content';
  import { initialLevel, type Notion } from '@app/core';
  import ChildBar from '../components/ChildBar.svelte';
  import LessonCard from '../components/LessonCard.svelte';
  import MixPicker from '../components/MixPicker.svelte';
  import NotionBadge from '../components/NotionBadge.svelte';
  import { isSeen, masteryOf, reviewOf } from '../lib/notions';
  import { navigate } from '../lib/router.svelte';
  import { activeChild, loadChildState, session } from '../lib/session.svelte';

  let { subjectId }: { subjectId: string } = $props();

  const subject = $derived(registry.subject(subjectId));
  const domains = $derived(
    registry
      .domainsOf(subjectId)
      .map((domain) => ({
        domain,
        plugins: registry.pluginsOfDomain(domain.id),
        notions: registry.notionsInScope(domain.id, activeChild()?.grade),
      }))
      .filter((d) => d.plugins.length > 0),
  );

  let lesson = $state<Notion | null>(null);
  let picker = $state(false);

  // L'acquisition des notions vient de l'état de l'enfant : on le charge s'il manque.
  $effect(() => {
    if (!session.childState) void loadChildState();
  });

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
    {#if domains.length}
      <button class="btn accent" onclick={() => (picker = true)}>🎲 Mélange : je choisis</button>
    {/if}

    {#each domains as { domain, plugins, notions } (domain.id)}
      <section class="domain">
        <div class="domain-head">
          <h2>{domain.icon} {domain.title}</h2>
          <button class="btn ghost small" onclick={() => navigate(`/mix/${domain.id}`)}
            >🎲 Mélanger</button
          >
        </div>
        {#if notions.length}
          <div class="notions">
            {#each notions as notion (notion.id)}
              <button
                class="notion"
                class:unseen={!isSeen(notion.id)}
                onclick={() => (lesson = notion)}
              >
                <span class="notion-title">📖 {notion.title}</span>
                {#if !isSeen(notion.id)}<span class="soon">bientôt en classe</span>{/if}
                <NotionBadge mastery={masteryOf(notion.id)} review={reviewOf(notion.id)} />
              </button>
            {/each}
          </div>
        {/if}
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

{#if lesson}
  <LessonCard notions={[lesson]} onclose={() => (lesson = null)} />
{/if}
{#if picker}
  <MixPicker scope={subjectId} onclose={() => (picker = false)} />
{/if}

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
  .domain-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .notions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .notion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border: 2px solid var(--primary-soft);
    border-radius: 14px;
    background: var(--surface);
    font-size: 0.95rem;
    text-align: left;
  }
  .notion.unseen {
    border-style: dashed;
    opacity: 0.75;
  }
  .soon {
    font-size: 0.8rem;
    color: var(--text-soft);
  }
  .notion:hover {
    border-color: var(--primary);
  }
  .notion-title {
    font-weight: 600;
    color: var(--primary-dark);
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
