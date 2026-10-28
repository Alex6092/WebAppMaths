import { expect, test, type Page } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

async function fakeVoice(page: Page) {
  // Une voix de test qui dit chaque phrase en 50 ms : sans Piper (CI), le serveur répond 503
  // et c'est la voix du navigateur qui raconte l'histoire.
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    type Utterance = { text: string; onstart?: () => void; onend?: () => void };
    const fake = {
      SpeechSynthesisUtterance: class {
        constructor(readonly text: string) {}
      },
      speechSynthesis: {
        getVoices: () => [{ name: 'Test', lang: 'fr-FR', localService: true }],
        speak(u: Utterance) {
          said.push(u.text);
          setTimeout(() => u.onstart?.(), 10);
          setTimeout(() => u.onend?.(), 50);
        },
        cancel() {},
        addEventListener() {},
        removeEventListener() {},
      },
    };
    for (const [name, value] of Object.entries(fake)) {
      Object.defineProperty(window, name, { value, configurable: true, writable: true });
    }
  });
}

test('un enfant écoute une histoire, répond aux questions et la relit corrigée', async ({
  page,
}) => {
  await fakeVoice(page);
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Français/ }).click();
  await page.getByRole('button', { name: /Écoute une histoire/ }).click();

  // Les questions arrivent quand l'histoire a été lue jusqu'au bout.
  const items = page.getByTestId('story-item');
  await expect(items.first()).toBeVisible();
  const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said);
  expect(said.filter((s) => s.length > 20).length).toBeGreaterThan(5);
  // Le texte ne se montre qu'après la correction.
  await expect(page.getByRole('region', { name: 'Le texte de l’histoire' })).toHaveCount(0);

  // Deux essais : le premier choix partout, puis un autre là où c'était faux.
  for (let i = 0; i < (await items.count()); i++)
    await items.nth(i).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Valider ✓' }).click();
  if (await page.getByRole('button', { name: 'Valider ✓' }).isVisible()) {
    for (let i = 0; i < (await items.count()); i++) {
      const choices = items.nth(i).getByRole('radio');
      if (await choices.first().isEnabled()) await choices.nth(1).click();
    }
    await page.getByRole('button', { name: 'Valider ✓' }).click();
  }

  const text = page.getByRole('region', { name: 'Le texte de l’histoire' });
  await expect(text).toBeVisible();
  await expect(text.locator('.proof').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Suivant|Terminer/ })).toBeVisible();
});

test('un enfant lit un texte seul, répond aux questions et voit les phrases-réponses', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Français/ }).click();
  await page.getByRole('button', { name: /Lis et comprends/ }).click();

  // Le texte et les questions sont là tout de suite, sans lecteur ni voix.
  const text = page.getByRole('region', { name: 'Le texte de l’histoire' });
  await expect(text).toBeVisible();
  await expect(page.getByTestId('story-listen')).toHaveCount(0);
  const items = page.getByTestId('story-item');
  await expect(items.first()).toBeVisible();
  await expect(text.locator('.proof')).toHaveCount(0);

  for (let i = 0; i < (await items.count()); i++)
    await items.nth(i).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Valider ✓' }).click();
  if (await page.getByRole('button', { name: 'Valider ✓' }).isVisible()) {
    for (let i = 0; i < (await items.count()); i++) {
      const choices = items.nth(i).getByRole('radio');
      if (await choices.first().isEnabled()) await choices.nth(1).click();
    }
    await page.getByRole('button', { name: 'Valider ✓' }).click();
  }

  await expect(text.locator('.proof').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Suivant|Terminer/ })).toBeVisible();
});

test('un enfant écoute une histoire et remet ses événements dans l’ordre', async ({ page }) => {
  await fakeVoice(page);
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Français/ }).click();
  await page.getByRole('button', { name: /Remets l’histoire dans l’ordre/ }).click();

  // Les événements arrivent quand l'histoire a été lue jusqu'au bout ; ils se posent un à un.
  const pool = page.getByTestId('story-event');
  await expect(pool.first()).toBeVisible();
  await expect(page.getByTestId('story-item')).toHaveCount(0);
  const placeAll = async () => {
    while ((await pool.count()) > 0) await pool.first().click();
  };
  await placeAll();
  await page.getByRole('button', { name: 'Valider ✓' }).click();
  // Au deuxième essai, les événements mal placés reviennent dans la réserve.
  if (await page.getByRole('button', { name: 'Valider ✓' }).isVisible()) {
    await placeAll();
    await page.getByRole('button', { name: 'Valider ✓' }).click();
  }

  const text = page.getByRole('region', { name: 'Le texte de l’histoire' });
  await expect(text).toBeVisible();
  await expect(text.locator('.tag.step').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Suivant|Terminer/ })).toBeVisible();
});
