<script lang="ts">
  interface Props {
    disabled?: boolean;
    ondigit: (digit: string) => void;
    ondelete: () => void;
    /** Sans onvalidate, pas de touche ✓ : l'écran a son propre bouton « Valider ». */
    onvalidate?: () => void;
  }
  let { disabled = false, ondigit, ondelete, onvalidate }: Props = $props();

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
</script>

<div class="numpad" aria-label="Pavé numérique">
  {#each digits as d (d)}
    <button class="key digit" {disabled} onclick={() => ondigit(d)}>{d}</button>
  {/each}
  <button class="key del" {disabled} onclick={ondelete} aria-label="Effacer">⌫</button>
  <button class="key digit" {disabled} onclick={() => ondigit('0')}>0</button>
  {#if onvalidate}
    <button class="key ok" {disabled} onclick={onvalidate} aria-label="Valider">✓</button>
  {/if}
</div>

<style>
  .numpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 260px;
  }
  .key {
    height: 60px;
    border: none;
    border-radius: 14px;
    font-size: 1.7rem;
    font-weight: 700;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
    transition: transform 0.1s;
  }
  .key:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }
  .digit {
    background: white;
    color: #1565c0;
    border: 2px solid #90caf9;
  }
  .del {
    background: var(--wrong-soft);
    color: var(--wrong);
    border: 2px solid #ef9a9a;
    font-size: 1.3rem;
  }
  .ok {
    background: linear-gradient(135deg, #81c784, var(--ok));
    color: white;
  }
  .key:disabled {
    opacity: 0.45;
  }
</style>
