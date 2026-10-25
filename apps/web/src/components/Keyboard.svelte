<script lang="ts">
  /** Clavier AZERTY à l'écran, avec les lettres accentuées (pas de clavier du système sur tablette). */
  interface Props {
    disabled?: boolean;
    onkey: (char: string) => void;
    ondelete: () => void;
  }
  let { disabled = false, onkey, ondelete }: Props = $props();

  const rows = [
    ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
    ['w', 'x', 'c', 'v', 'b', 'n', "'", '-'],
  ];
  const accents = ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ô', 'ë', 'ï'];
</script>

<div class="keyboard" aria-label="Clavier">
  <div class="row accents">
    {#each accents as k (k)}
      <button class="key accent" {disabled} onclick={() => onkey(k)}>{k}</button>
    {/each}
  </div>
  {#each rows as row, r (r)}
    <div class="row">
      {#each row as k (k)}
        <button class="key" {disabled} onclick={() => onkey(k)}>{k}</button>
      {/each}
      {#if r === 2}
        <button class="key del" {disabled} onclick={ondelete} aria-label="Effacer">⌫</button>
      {/if}
    </div>
  {/each}
  <div class="row">
    <button class="key space" {disabled} onclick={() => onkey(' ')} aria-label="Espace"
      >espace</button
    >
  </div>
</div>

<style>
  .keyboard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 720px;
    user-select: none;
  }
  .row {
    display: flex;
    justify-content: center;
    gap: 5px;
  }
  .key {
    flex: 1 1 0;
    max-width: 62px;
    height: 54px;
    border: 2px solid #90caf9;
    border-radius: 10px;
    background: white;
    color: #0d47a1;
    font-size: 1.5rem;
    font-weight: 700;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.18);
    touch-action: manipulation;
  }
  .key:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
  }
  .accent {
    background: #fff8e1;
    border-color: #ffd54f;
    color: #6d4c00;
    height: 48px;
  }
  .del {
    max-width: 90px;
    flex-grow: 1.6;
    background: var(--wrong-soft);
    border-color: #ef9a9a;
    color: var(--wrong);
  }
  .space {
    max-width: 360px;
    flex-grow: 6;
    font-size: 1.1rem;
  }
  .key:disabled {
    opacity: 0.45;
  }
  @media (max-width: 520px) {
    .key {
      height: 46px;
      font-size: 1.2rem;
      border-radius: 8px;
    }
    .row {
      gap: 3px;
    }
  }
</style>
