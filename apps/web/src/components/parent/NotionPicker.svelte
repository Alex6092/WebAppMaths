<script lang="ts">
  import { registry } from '@app/content';
  import type { GradeId } from '@app/core';
  import type { SvelteSet } from 'svelte/reactivity';

  /** Cases à cocher des notions de la classe qui ont des exercices, groupées par domaine. */
  let {
    grade,
    chosen,
    legend = 'Notions à travailler',
  }: { grade: GradeId; chosen: SvelteSet<string>; legend?: string } = $props();

  const groups = $derived(
    registry.domains
      .map((domain) => ({
        domain,
        notions: registry
          .notionsInScope(domain.id, grade)
          .filter((n) => registry.pluginsOfNotions([n.id]).length > 0),
      }))
      .filter((g) => g.notions.length > 0),
  );
</script>

<fieldset>
  <legend>{legend}</legend>
  {#each groups as { domain, notions } (domain.id)}
    <p class="domain">{domain.icon} {domain.title}</p>
    <div class="notions">
      {#each notions as notion (notion.id)}
        <label>
          <input
            type="checkbox"
            checked={chosen.has(notion.id)}
            onchange={(e) =>
              e.currentTarget.checked ? chosen.add(notion.id) : chosen.delete(notion.id)}
          />
          {notion.title}
        </label>
      {/each}
    </div>
  {/each}
</fieldset>

<style>
  fieldset {
    border: 1px solid #e3d9ec;
    border-radius: 12px;
    padding: 8px 12px 12px;
  }
  legend {
    font-weight: 700;
    color: var(--primary-dark);
  }
  .domain {
    font-weight: 700;
    font-size: 0.9rem;
    margin-top: 6px;
  }
  .notions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 4px 12px;
    font-size: 0.9rem;
  }
  .notions label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .notions input {
    accent-color: var(--primary);
  }
</style>
