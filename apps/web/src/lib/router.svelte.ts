/**
 * Routeur minimal par hash (#/home, #/exercise/maths.calcul.addition-posee…).
 * Le hash évite toute règle de réécriture côté reverse proxy.
 */
function parse(hash: string): { path: string; segments: string[]; query: URLSearchParams } {
  const raw = hash.replace(/^#/, '') || '/';
  const [path = '/', search = ''] = raw.split('?');
  return {
    path,
    segments: path.split('/').filter(Boolean).map(decodeURIComponent),
    query: new URLSearchParams(search),
  };
}

export const route = $state(parse(location.hash));

window.addEventListener('hashchange', () => {
  const next = parse(location.hash);
  if (next.path !== route.path || String(next.query) !== String(route.query))
    Object.assign(route, next);
  window.scrollTo(0, 0);
});

/** Change d'écran tout de suite (sans attendre l'évènement hashchange, qui arrive plus tard). */
export function navigate(path: string): void {
  Object.assign(route, parse(path));
  location.hash = path;
}
