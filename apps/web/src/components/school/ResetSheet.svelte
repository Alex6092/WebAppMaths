<script lang="ts">
  import type { CreatedInvitation } from '@app/core';
  import { printable } from '../../lib/portal';
  import QrCode from '../QrCode.svelte';

  /** La fiche de réinitialisation à remettre aux parents d'un élève (accès oublié). */
  let {
    reset,
    firstName,
    className,
    schoolName,
    onclose,
  }: {
    reset: CreatedInvitation;
    firstName: string;
    className: string;
    schoolName: string;
    onclose: () => void;
  } = $props();

  const appUrl = `${location.origin}${location.pathname}`;
  const link = $derived(`${appUrl}#/reinitialiser?code=${reset.code}`);
  const date = (ms: number) => new Date(ms).toLocaleDateString('fr-FR');
</script>

<div
  class="overlay"
  use:printable
  role="dialog"
  aria-modal="true"
  aria-label="Fiche de réinitialisation"
>
  <div class="toolbar no-print">
    <button class="btn" onclick={() => window.print()}>🖨️ Imprimer</button>
    <button class="btn ghost" onclick={onclose}>Fermer</button>
    <p>Ce code ne s’affiche qu’une fois. Une nouvelle fiche remplace la précédente.</p>
  </div>
  <article class="sheet">
    <header>
      <h1>🎒 Cartable magique · mot de passe oublié</h1>
      <p>Pour un parent de <strong>{firstName}</strong> · {className} · {schoolName}</p>
    </header>
    <div class="body">
      <div class="qr"><QrCode text={link} label="QR code de réinitialisation" /></div>
      <div class="steps">
        <ol>
          <li>Scanne le QR code avec un téléphone ou une tablette.</li>
          <li>Saisis l’e-mail de ton compte et choisis un nouveau mot de passe.</li>
          <li>
            Les autres appareils seront déconnectés : reconnecte-les avec le nouveau mot de passe.
          </li>
        </ol>
        <p class="manual">
          Sans QR code : va sur <span class="url">{appUrl}</span>, puis « Mot de passe oublié ? »,
          et saisis :
        </p>
        <p class="code">{reset.code}</p>
      </div>
    </div>
    <footer>
      Code personnel, valable jusqu’au {date(reset.expiresAt)}, à n’utiliser qu’une fois. Ne le
      donne à personne d’autre.
    </footer>
  </article>
</div>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 55;
    overflow-y: auto;
    background: #6d6478;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 16px 16px 40px;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 16px;
    background: var(--surface);
    box-shadow: var(--shadow);
    max-width: 21cm;
  }
  .toolbar p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-soft);
  }
  .sheet {
    background: white;
    color: #111;
    width: 21cm;
    max-width: 100%;
    padding: 1cm 1.2cm;
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 0.35cm;
    font-size: 11.5pt;
  }
  header h1 {
    font-size: 15pt;
  }
  header p {
    margin: 0;
  }
  .body {
    display: flex;
    gap: 0.8cm;
    align-items: flex-start;
  }
  .qr {
    flex: 0 0 4.4cm;
    width: 4.4cm;
  }
  .steps {
    flex: 1;
  }
  ol {
    margin: 0 0 0.3cm;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 0.15cm;
  }
  .manual {
    margin: 0;
    font-size: 10pt;
    color: #444;
  }
  .url {
    font-family: ui-monospace, monospace;
    word-break: break-all;
  }
  .code {
    margin: 0.1cm 0 0;
    font-family: ui-monospace, monospace;
    font-size: 18pt;
    font-weight: 700;
    letter-spacing: 2px;
  }
  footer {
    font-size: 9pt;
    color: #555;
  }
  @media print {
    .overlay {
      position: static;
      display: block;
      background: none;
      padding: 0;
      overflow: visible;
    }
    .sheet {
      width: auto;
      padding: 0;
      box-shadow: none;
    }
  }
  @media (max-width: 600px) {
    .body {
      flex-direction: column;
    }
  }
</style>
