<script lang="ts">
  import { onMount } from 'svelte';
  import Effects from './components/Effects.svelte';
  import { errorMessage } from './lib/api';
  import { mixNotions } from './lib/notions';
  import { navigate, route } from './lib/router.svelte';
  import { activeChild, loadChildState, refreshMe, session } from './lib/session.svelte';
  import ChildHome from './screens/ChildHome.svelte';
  import Exercise from './screens/Exercise.svelte';
  import Gallery from './screens/Gallery.svelte';
  import Login from './screens/Login.svelte';
  import Parent from './screens/Parent.svelte';
  import Profiles from './screens/Profiles.svelte';
  import Register from './screens/Register.svelte';
  import Shop from './screens/Shop.svelte';
  import Subject from './screens/Subject.svelte';

  let fatal = $state<string | null>(null);

  onMount(() => {
    refreshMe().catch((e) => (fatal = errorMessage(e)));
  });

  // Écrans qui demandent un profil enfant actif.
  const CHILD_SCREENS = new Set(['home', 'subject', 'exercise', 'mix', 'shop', 'collection']);

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

{#if fatal}
  <div class="screen"><p class="error-msg">{fatal}</p></div>
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
{:else if view === 'shop'}
  <Shop mode="shop" />
{:else if view === 'collection'}
  <Shop mode="collection" />
{:else if view === 'gallery'}
  <Gallery />
{/if}

<Effects />

<style>
  .loading {
    justify-content: center;
    font-size: 3rem;
  }
</style>
