import { expect, test } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

test('un enfant pose une addition, gagne des pièces et voit son bilan', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: /Mathématiques/ }).click();
  await page.getByRole('button', { name: /Additions posées/ }).click();

  // On lit l'opération affichée, puis on tape le résultat au pavé numérique, des unités vers la gauche.
  const grid = page.locator('[data-operands]');
  await expect(grid).toBeVisible();
  const operands = (await grid.getAttribute('data-operands'))!.split(',').map(Number);
  const result = String(operands.reduce((sum, n) => sum + n, 0));
  for (const digit of [...result].reverse()) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Valider' }).click();

  await expect(page.getByRole('status').filter({ hasText: /Tu gagnes/ })).toBeVisible();
  await page.getByRole('button', { name: 'Suivant ➡️' }).click();

  await page.getByRole('button', { name: /ai fini/ }).click();
  await expect(page.getByText(/du premier coup sur/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByRole('heading', { name: /Mathématiques/ })).toBeVisible();
});

test('l’espace parent est verrouillé quand un enfant utilise l’appareil', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
  await page.getByRole('button', { name: 'Changer de profil' }).click();
  await page.getByRole('button', { name: /Espace parent/ }).click();
  await expect(page.getByRole('button', { name: 'Déverrouiller' })).toBeVisible();
});
