<script lang="ts">
  import { install, platform, pwa } from '../../lib/pwa.svelte';

  // L'appareil qu'on tient en main d'abord ; les autres en dessous.
  const here = platform();
  const STEPS = {
    ipad: {
      name: 'iPad',
      how: 'Dans Safari, touche Partager (le carré avec une flèche), puis « Sur l’écran d’accueil ».',
    },
    android: {
      name: 'Tablette Android',
      how: 'Dans Chrome, touche le menu ⋮ puis « Installer l’application » (ou « Ajouter à l’écran d’accueil »).',
    },
    windows: {
      name: 'PC ou tablette Windows',
      how: 'Dans Chrome, clique sur l’icône d’installation au bout de la barre d’adresse (ou menu ⋮ › « Installer Cartable magique »).',
    },
  } as const;
  const others = (['ipad', 'android', 'windows'] as const).filter((p) => p !== here);
</script>

<section class="card">
  <h2>📲 Installer l’app</h2>
  {#if pwa.installed}
    <p>✅ L’app est installée sur cet appareil : elle s’ouvre en plein écran depuis son icône.</p>
  {:else}
    <p>
      Installée sur l’écran d’accueil, l’app s’ouvre en plein écran avec sa propre icône, comme une
      vraie application.
    </p>
    {#if pwa.canInstall}
      <button class="btn small" onclick={install}>Installer sur cet appareil</button>
    {:else if here !== 'other'}
      <p><strong>{STEPS[here].name} :</strong> {STEPS[here].how}</p>
    {/if}
  {/if}
  <details>
    <summary>Sur les autres appareils</summary>
    <ul>
      {#each others as p (p)}
        <li><strong>{STEPS[p].name} :</strong> {STEPS[p].how}</li>
      {/each}
    </ul>
  </details>
</section>

<style>
  /* Comme les autres cartes de l'espace parent. */
  h2 {
    color: var(--primary);
    font-size: 1.25rem;
  }

  details {
    margin-top: 8px;
  }

  summary {
    cursor: pointer;
    font-weight: 700;
  }

  ul {
    margin: 8px 0 0;
    padding-left: 20px;
  }

  li + li {
    margin-top: 6px;
  }
</style>
