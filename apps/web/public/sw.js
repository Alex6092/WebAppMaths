// Service worker du Cartable magique : l'app démarre vite, même sur un réseau lent.
// - assets/ et icons/ (noms à empreinte, jamais modifiés) : depuis le cache, sinon le réseau ;
// - la page : le réseau d'abord (un nouveau déploiement est pris au chargement suivant), le cache
//   seulement sans connexion ;
// - api/ : jamais en cache (les réponses de l'enfant, la voix du serveur…).
const CACHE = 'cartable-v1';
const scope = new URL(self.registration.scope);
const PAGE = scope.href;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  if (path.startsWith('api/')) return;
  if (request.mode === 'navigate') event.respondWith(page(request));
  else if (path.startsWith('assets/') || path.startsWith('icons/'))
    event.respondWith(asset(request));
});

async function page(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const html = await response.clone().text();
      const previous = await cache.match(PAGE);
      if (!previous || (await previous.text()) !== html) await prune(cache, html);
      await cache.put(PAGE, response.clone());
      return response;
    }
    // Serveur en plein redémarrage (déploiement) : la dernière page connue plutôt qu'une erreur.
    return (await cache.match(PAGE)) ?? response;
  } catch {
    return (await cache.match(PAGE)) ?? Response.error();
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/** Nouvelle version : on oublie les fichiers que la nouvelle page n'utilise plus. */
async function prune(cache, html) {
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname.slice(scope.pathname.length);
    if (path.startsWith('assets/') && !html.includes(path)) await cache.delete(request);
  }
}
