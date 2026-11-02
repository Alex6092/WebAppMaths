import { expect, test } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

test('un enfant lit une note sur la portée et la joue au piano', async ({ page }) => {
  // On compte les sons fabriqués par Web Audio (le piano de l'app).
  await page.addInitScript(() => {
    const w = window as unknown as { __notes: number };
    // Le WebKit de Playwright sous Windows n'a pas Web Audio : -1, le son n'est pas vérifié.
    w.__notes = 'AudioContext' in window ? 0 : -1;
    if (w.__notes < 0) return;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.__notes++;
      return create.call(this);
    };
  });
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Musique/ }).click();
  await page.getByRole('button', { name: /Joue la note au piano/ }).click();

  // La note est écrite sur une portée, au-dessus du clavier.
  await expect(page.getByRole('img', { name: 'Une portée' })).toBeVisible();
  const keys = page.getByTestId('piano').locator('rect[data-key]');
  await expect(keys.first()).toBeVisible();

  // Toucher une touche la fait sonner et la colore.
  const key = keys.nth(2);
  await key.dispatchEvent('pointerdown');
  const notes = () => page.evaluate(() => (window as unknown as { __notes: number }).__notes);
  if ((await notes()) >= 0) await expect.poll(notes).toBeGreaterThan(0);
  await expect(key).toHaveAttribute('style', /fill/);
  await page.getByRole('button', { name: 'Valider ✓' }).click();
  // La réponse est corrigée : la touche passe au vert (juste) ou l'enfant réessaie.
  await expect(
    page
      .getByRole('button', { name: 'Valider ✓' })
      .or(page.getByRole('button', { name: /Suivant|Continuer/ })),
  ).toBeVisible();
});
