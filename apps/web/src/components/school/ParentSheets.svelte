<script lang="ts">
  import type { PupilCode, PupilDto } from '@app/core';
  import { printable } from '../../lib/portal';
  import QrCode from '../QrCode.svelte';

  /** Les fiches parents à imprimer (deux par page A4, à découper). */
  let {
    codes,
    pupils,
    className,
    schoolName,
    onclose,
  }: {
    codes: PupilCode[];
    pupils: PupilDto[];
    className: string;
    schoolName: string;
    onclose: () => void;
  } = $props();

  const appUrl = `${location.origin}${location.pathname}`;
  const linkOf = (code: string) => `${appUrl}#/activer?code=${code}`;
  const pupilOf = (id: number) => pupils.find((p) => p.id === id);
  const date = (ms: number) => new Date(ms).toLocaleDateString('fr-FR');
</script>

<div class="overlay" use:printable role="dialog" aria-modal="true" aria-label="Fiches parents">
  <div class="toolbar no-print">
    <button class="btn" onclick={() => window.print()}>🖨️ Imprimer</button>
    <button class="btn ghost" onclick={onclose}>Fermer</button>
    <p>
      Ces codes ne s’affichent qu’une fois : imprime-les maintenant. Tu pourras en refaire, les
      anciens ne marcheront plus.
    </p>
  </div>
  <div class="paper">
    {#each codes as c (c.pupilId)}
      {@const pupil = pupilOf(c.pupilId)}
      <article class="sheet">
        <header>
          <h1>🎒 Cartable magique</h1>
          <p>Compte parent de <strong>{pupil?.firstName} {pupil?.lastName ?? ''}</strong></p>
          <p class="where">{className} · {schoolName}</p>
        </header>
        <div class="body">
          <div class="qr">
            <QrCode text={linkOf(c.code)} label="QR code de {pupil?.firstName}" />
          </div>
          <div class="steps">
            <ol>
              <li>Scanne le QR code avec un téléphone ou une tablette.</li>
              <li>
                Crée ton compte parent (e-mail et mot de passe). Tu as déjà un compte pour un autre
                enfant ? Choisis « J’ai déjà un compte ».
              </li>
              <li>{pupil?.firstName} choisit son profil et s’entraîne.</li>
            </ol>
            <p class="manual">
              Sans QR code : va sur <span class="url">{appUrl}</span>, puis « J’ai un code
              d’invitation », et saisis :
            </p>
            <p class="code">{c.code}</p>
          </div>
        </div>
        <footer>
          Code personnel, valable jusqu’au {date(c.expiresAt)}. L’enseignant voit la progression de
          {pupil?.firstName}, à l’école comme à la maison ; l’app ne garde que son prénom, sa classe
          et ses réponses aux exercices.
        </footer>
      </article>
    {/each}
  </div>
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
  .paper {
    background: white;
    color: #111;
    width: 21cm;
    max-width: 100%;
    padding: 0.8cm 1.2cm;
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.25);
  }
  .sheet {
    display: flex;
    flex-direction: column;
    gap: 0.35cm;
    min-height: 12.6cm;
    padding: 0.6cm 0;
    border-bottom: 2px dashed #999;
    break-inside: avoid;
    font-size: 11.5pt;
  }
  .sheet:nth-child(2n) {
    break-after: page;
  }
  .sheet:last-child {
    border-bottom: none;
  }
  header h1 {
    font-size: 16pt;
  }
  header p {
    margin: 0;
  }
  .where {
    color: #555;
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
    .paper {
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
