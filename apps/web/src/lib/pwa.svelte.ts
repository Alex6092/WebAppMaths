/**
 * L'app installée sur l'écran d'accueil : le service worker (démarrage rapide), l'invitation
 * à installer, la connexion perdue et la nouvelle version à charger.
 */

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const pwa = $state({
  /** Chrome (Windows, Android) propose d'installer l'app : un bouton peut le faire. */
  canInstall: false,
  installed: false,
  online: true,
  /** Un déploiement a eu lieu depuis le chargement de la page. */
  updateReady: false,
});

let installPrompt: InstallPrompt | null = null;
let loadedVersion: string | null = null;
/** On regarde s'il y a une nouvelle version au plus toutes les 10 minutes. */
const CHECK_EVERY_MS = 10 * 60_000;
let lastCheck = 0;

export type Platform = 'ipad' | 'android' | 'windows' | 'other';

export function platform(): Platform {
  const ua = navigator.userAgent;
  // Les iPad récents se présentent comme un Mac : on les reconnaît à l'écran tactile.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'ipad';
  }
  if (/Android/.test(ua)) return 'android';
  if (/Windows/.test(ua)) return 'windows';
  return 'other';
}

function standalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function install(): Promise<void> {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === 'accepted') pwa.installed = true;
  installPrompt = null;
  pwa.canInstall = false;
}

async function serverVersion(): Promise<string | null> {
  try {
    const res = await fetch('api/health', { cache: 'no-store' });
    return res.ok ? (((await res.json()) as { version?: string }).version ?? null) : null;
  } catch {
    return null;
  }
}

/** Compare la version du serveur à celle de la page chargée. */
export async function checkForUpdate(): Promise<boolean> {
  lastCheck = Date.now();
  const version = await serverVersion();
  if (!version) return pwa.updateReady;
  if (loadedVersion === null) loadedVersion = version;
  else if (version !== loadedVersion) pwa.updateReady = true;
  return pwa.updateReady;
}

/**
 * Lancé une fois au démarrage. onReturn est appelé quand l'enfant revient dans l'app (la
 * tablette sort de veille, l'app revient au premier plan) et qu'une nouvelle version est prête.
 */
export function startPwa(onReturn: () => void): void {
  pwa.installed = standalone();
  pwa.online = navigator.onLine;
  addEventListener('online', () => (pwa.online = true));
  addEventListener('offline', () => (pwa.online = false));
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    pwa.canInstall = true;
  });
  addEventListener('appinstalled', () => {
    pwa.installed = true;
    pwa.canInstall = false;
  });

  void checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastCheck < CHECK_EVERY_MS) return;
    void checkForUpdate().then((ready) => ready && onReturn());
  });

  // Chemin relatif : sous n'importe quel sous-chemin (BASE_PATH), le service worker couvre l'app.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
