import { expect, test as setup } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

setup('création de la famille de test par l’interface', async ({ page }) => {
  await page.goto(`/#/register?code=${E2E_ACCOUNT.code}`);
  await page.getByLabel('E-mail du parent').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe (8 caractères minimum)').fill(E2E_ACCOUNT.password);
  await page.getByLabel('Mot de passe, encore une fois').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Créer le compte' }).click();

  await expect(page.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  await page.getByLabel('Prénom').fill(E2E_ACCOUNT.child);
  await page.getByRole('button', { name: 'Créer le profil' }).click();
  await expect(
    page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).first(),
  ).toBeVisible();
});
