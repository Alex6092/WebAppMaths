<script lang="ts">
  import { speak, ttsAvailable } from '../lib/tts';

  interface Props {
    text: string;
    lang?: string;
  }
  let { text, lang = 'fr-FR' }: Props = $props();
</script>

{#if ttsAvailable()}
  <button
    class="speak"
    onclick={() => speak(text, lang)}
    aria-label="Écouter la consigne"
    title="Écouter"
  >
    🔊
  </button>
{/if}

<style>
  .speak {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--primary-soft);
    background: white;
    font-size: 1.4rem;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
  }
  .speak:active {
    transform: translateY(2px);
  }
</style>
