<script lang="ts">
  import { onMount } from 'svelte';
  import Effects from './components/Effects.svelte';
  import { errorMessage } from './lib/api';
  import { mixNotions } from './lib/notions';
  import { pwa, startPwa } from './lib/pwa.svelte';
  import { navigate, route } from './lib/router.svelte';
  import { activeChild, loadChildState, refreshMe, session } from './lib/session.svelte';
  import Badges from './screens/Badges.svelte';
  import ChildHome from './screens/ChildHome.svelte';
  import Exercise from './screens/Exercise.svelte';
  import Gallery from './screens/Gallery.svelte';
  import Login from './screens/Login.svelte';
  import Parent from './screens/Parent.svelte';
  import Profiles from './screens/Profiles.svelte';
  import Register from './screens/Register.svelte';
  import Shop from './screens/Shop.svelte';
  import Subject from './screens/Subject.svelte';
  import Themes from './screens/Themes.svelte';

  let fatal = $state<string | null>(null);

  // Pendant un exercice ou dans l'espace parent, on ne recharge pas l'app sans prévenir.
  const BUSY_SCREENS = new Set(['exercise', 'mix', 'daily', 'review', 'homework', 'evaluation']);

  onMount(() => {
    refreshMe().catch((e) => (fatal = errorMessage(e)));
    startPwa(() => {
      if (!BUSY_SCREENS.has(view) && view !== 'parent') location.reload();
    });
  });

  // Écrans qui demandent un profil enfant actif.
  const CHILD_SCREENS = new Set([
    'home',
    'subject',
    'exercise',
    'mix',
    'daily',
    'review',
    'homework',
    'evaluation',
    'shop',
    'collection',
    'themes',
    'badges',
  ]);

  const view = $derived.by(() => {
    if (!session.ready) return 'loading';
    const [first = ''] = route.segments;
    if (!session.me) return first === 'register' ? 'register' : 'login';
    if (first === 'dev' && route.segments[1] === 'gallery') {
      return import.meta.env.DEV || session.me.user.role === 'admin' ? 'gallery' : 'redirect';
    }
    if (first === 'parent' || first === 'profiles') return first;
    if (CHILD_SCREENS.has(first)) return activeChild() ? first : 'redirect';
    return 'redirect';
  });

  // Redirections : page d'accueil de l'enfant si un profil est choisi, sinon le choix du profil.
  $effect(() => {
    if (view === 'redirect') navigate(activeChild() ? '/home' : '/profiles');
    if (view === 'login' && route.segments[0] !== 'login') navigate('/login');
  });

  $effect(() => {
    if (session.me?.activeChildId && !session.childState) {
      loadChildState().catch((e) => (fatal = errorMessage(e)));
    }
  });
</script>

{#if !pwa.online}
  <p class="banner" role="status">
    📡 Pas de connexion à Internet : tes réponses ne peuvent pas être envoyées.
  </p>
{:else if pwa.updateReady}
  <p class="banner" role="status">
    ✨ Une nouvelle version de l’app est prête.
    <button class="btn small" onclick={() => location.reload()}>Recharger</button>
  </p>
{/if}

{#if fatal}
  <div class="screen">
    <p class="error-msg">{fatal}</p>
    <button class="btn" onclick={() => location.reload()}>Réessayer</button>
  </div>
{:else if view === 'loading'}
  <div class="screen loading">⏳</div>
{:else if view === 'login'}
  <Login />
{:else if view === 'register'}
  <Register />
{:else if view === 'profiles'}
  <Profiles />
{:else if view === 'parent'}
  <Parent />
{:else if view === 'home'}
  <ChildHome />
{:else if view === 'subject'}
  {#key route.segments[1]}<Subject subjectId={route.segments[1] ?? ''} />{/key}
{:else if view === 'exercise'}
  {#key route.segments[1]}<Exercise pluginId={route.segments[1] ?? ''} />{/key}
{:else if view === 'mix'}
  {#key `${route.path}?${route.query}`}
    <Exercise
      mix={mixNotions(route.segments[1], route.query.get('n'), activeChild()?.grade ?? 'CE1')}
    />
  {/key}
{:else if view === 'daily'}
  <Exercise daily mix={mixNotions('all', null, activeChild()?.grade ?? 'CE1')} />
{:else if view === 'homework'}
  {#key route.segments[1]}<Exercise homework={Number(route.segments[1])} />{/key}
{:else if view === 'evaluation'}
  {#key route.segments[1]}<Exercise evaluation={Number(route.segments[1])} />{/key}
{:else if view === 'review'}
  <Exercise review />
{:else if view === 'shop'}
  <Shop mode="shop" />
{:else if view === 'collection'}
  <Shop mode="collection" />
{:else if view === 'themes'}
  <Themes />
{:else if view === 'badges'}
  <Badges />
{:else if view === 'gallery'}
  <Gallery />
{/if}

<Effects />

<style>
  .banner {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px 12px;
    margin: 0;
    padding: max(8px, env(safe-area-inset-top)) 16px 8px;
    background: #fff8e1;
    color: #4e342e;
    font-weight: 700;
    text-align: center;
    box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
  }

  .loading {
    justify-content: center;
    font-size: 3rem;
  }
</style>
