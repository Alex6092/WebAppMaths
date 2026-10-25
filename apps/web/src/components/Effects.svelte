<script lang="ts">
  import { untrack } from 'svelte';
  import { effects } from '../lib/effects.svelte';

  const COLORS = ['#f06292', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#ff8a65'];

  interface Piece {
    id: number;
    left: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
  }
  let pieces = $state<Piece[]>([]);
  let nextId = 0;

  // Ne dépend que du compteur de salves : `pieces` est lu hors suivi, sinon l'effet se relancerait lui-même.
  $effect(() => {
    if (effects.confettiBurst > 0) untrack(launch);
  });

  function launch() {
    const burst = Array.from({ length: 40 }, () => ({
      id: nextId++,
      left: Math.random() * 100,
      size: 8 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
    }));
    pieces = [...pieces, ...burst];
    const ids = new Set(burst.map((p) => p.id));
    setTimeout(() => (pieces = pieces.filter((p) => !ids.has(p.id))), 4200);
  }
</script>

<div class="confetti" aria-hidden="true">
  {#each pieces as p (p.id)}
    <span
      style:left="{p.left}vw"
      style:width="{p.size}px"
      style:height="{p.size}px"
      style:background={p.color}
      style:animation-duration="{p.duration}s"
      style:animation-delay="{p.delay}s"
    ></span>
  {/each}
</div>

<div class="toast" class:show={effects.toast !== null} role="status">{effects.toast ?? ''}</div>

<style>
  .confetti {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999;
    overflow: hidden;
  }
  .confetti span {
    position: absolute;
    top: -20px;
    border-radius: 2px;
    animation: fall linear forwards;
  }
  @keyframes fall {
    0% {
      transform: translateY(-20px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(105vh) rotate(720deg);
      opacity: 0;
    }
  }
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    background: var(--primary-dark);
    color: white;
    border-radius: 16px;
    padding: 12px 24px;
    font-weight: 700;
    z-index: 1000;
    transition: transform 0.35s;
    max-width: calc(100vw - 32px);
    text-align: center;
    pointer-events: none;
  }
  .toast.show {
    transform: translateX(-50%) translateY(0);
  }
</style>
