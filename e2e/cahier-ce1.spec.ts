import { expect, test, type Page } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) })).toBeVisible();
}

test('le CE1 ouvre l’EMC, écoute une syllabe et lit le tableau des aliments', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await page.route('**/api/tts', (route) => route.fulfill({ status: 503 }));
  await page.addInitScript(() => {
    const said: string[] = [];
    Object.assign(window, { said });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {
        constructor(readonly text: string) {}
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{ name: 'Test', lang: 'fr-FR', localService: true }],
        speak(utterance: { text: string; onstart?: () => void; onend?: () => void }) {
          said.push(utterance.text);
          utterance.onstart?.();
          setTimeout(() => utterance.onend?.(), 10);
        },
        cancel() {},
      },
    });
  });

  await login(page);
  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Enseignement moral et civique/ }).click();
  await page.getByRole('button', { name: /Que fait un délégué de classe/ }).click();
  await expect(page.getByRole('radio')).toHaveCount(3);

  await page.goto('/#/exercise/francais.lecture.ecoute-touche-p');
  await page.getByTestId('listen').click();
  const choices = (await page.getByRole('radio').allTextContents()).map((text) => text.trim());
  const spoken = () => page.evaluate(() => (window as unknown as { said: string[] }).said);
  await expect.poll(async () => (await spoken()).some((text) => choices.includes(text))).toBe(true);

  await page.goto('/#/exercise/qlm.vivant.lis-tableau-nutriments');
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(7);
  await expect(table.getByRole('columnheader', { name: /Calcium \(mg\)/i })).toBeVisible();
  await expect(table.getByRole('rowheader')).toHaveCount(3);
  const bounds = (await table.locator('..').boundingBox())!;
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Écouter la consigne' }).click();
  await expect.poll(async () => (await spoken()).join(' ')).toMatch(/calcium \d+ milligrammes/);
});

test('le parent sélectionne les notions en devoir et imprime le tableau avec ses unités', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: /Espace parent/ }).click();
  const unlock = page.getByRole('button', { name: 'Déverrouiller' });
  if (await unlock.isVisible()) {
    await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
    await unlock.click();
  }
  await page.getByRole('button', { name: /Donner un devoir/ }).click();
  const homework = page.getByRole('group', { name: 'Notions à travailler' });
  await homework.getByRole('checkbox', { name: 'Les délégués de classe' }).check();
  await homework.getByRole('checkbox', { name: 'Lire un tableau de nutriments' }).check();
  await expect(page.getByRole('button', { name: 'Donner le devoir' })).toBeEnabled();
  await page.getByRole('button', { name: 'Annuler' }).click();

  await page.getByRole('button', { name: /Préparer une fiche/ }).click();
  const notions = page.getByRole('group', { name: 'Notions de la fiche' });
  await notions.getByRole('checkbox', { name: 'Lire un tableau de nutriments' }).check();
  await notions.getByRole('checkbox', { name: 'Comparer des longueurs' }).check();
  await page.getByRole('button', { name: 'Voir la fiche' }).click();
  const sheet = page.getByRole('dialog', { name: 'Fiche à imprimer' });
  const tables = sheet.getByRole('table', { name: /Valeurs illustratives pour 100 grammes/ });
  await expect(tables).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 840 });
  await page.emulateMedia({ media: 'print' });
  await expect(tables.first().getByRole('columnheader')).toHaveCount(7);
  await expect(
    sheet
      .locator('.key')
      .getByText(/Un mètre vaut 100 centimètres|Je convertis en centimètres/)
      .first(),
  ).toBeVisible();
  expect(
    await tables.first().evaluate((table) => {
      const wrapper = table.parentElement!;
      return table.getBoundingClientRect().width <= wrapper.getBoundingClientRect().width + 1;
    }),
  ).toBe(true);
});
