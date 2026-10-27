import { expect, test, type Page } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
}

test('l’app s’installe : manifeste et icônes servis', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  expect(res.headers()['content-type']).toMatch(/manifest\+json|json/);
  const manifest = await res.json();
  expect(manifest).toMatchObject({ display: 'standalone', start_url: './' });
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await request.get(apple!)).ok()).toBe(true);
});

test('le 🔊 lit toujours la consigne, par le serveur ou par la voix du navigateur', async ({
  page,
}) => {
  // On espionne les deux voix : le lecteur audio (voix du serveur) et la synthèse du navigateur.
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    HTMLMediaElement.prototype.play = function () {
      said.push(`audio:${this.src.startsWith('blob:') ? 'blob' : this.src}`);
      return Promise.resolve();
    };
    // Le WebKit de Playwright n'a pas de synthèse vocale ; Safari sur iPad en a une.
    if (!('speechSynthesis' in window)) {
      const w = window as unknown as Record<string, unknown>;
      w.SpeechSynthesisUtterance = class {
        constructor(readonly text: string) {}
      };
      w.speechSynthesis = {
        getVoices: () => [],
        cancel() {},
        addEventListener() {},
        removeEventListener() {},
      };
    }
    speechSynthesis.speak = (u) => void said.push(`navigateur:${u.text}`);
  });
  await login(page);
  await page.getByRole('button', { name: /Mathématiques/ }).click();
  await page.getByRole('button', { name: /Additions posées/ }).click();
  // Le premier toucher a déjà débloqué le son (un silence) : on ne compte que ce qui suit.
  await page.evaluate(() => ((window as unknown as { __said: string[] }).__said.length = 0));
  await page.getByRole('button', { name: 'Écouter la consigne' }).first().click();

  // Sans Piper (CI), le serveur répond 503 : c'est la voix du navigateur qui lit la consigne.
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said))
    .toContainEqual(expect.stringMatching(/^navigateur:.+|^audio:blob/));
});

test('le service worker garde l’app ouverte sans connexion', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'pc', 'service worker vérifié dans Chromium');
  await login(page);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Deuxième chargement : la page passe par le service worker et entre dans son cache.
  await page.reload();
  const child = page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) });
  await expect(child).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  // La page vient du cache : l'app s'affiche et dit qu'il n'y a pas de connexion.
  await expect(page.getByText(/Pas de connexion/).first()).toBeVisible();
  await context.setOffline(false);
});
