import { expect, test, type Page } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

async function login(page: Page, url: string) {
  await page.goto(url);
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) })).toBeVisible();
}

test('une notion décochée reste lisible et ses exercices autonomes sont bloqués', async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, baseURL!);
  await page.getByRole('button', { name: /Espace parent/ }).click();
  const unlock = page.getByRole('button', { name: 'Déverrouiller' });
  if (await unlock.isVisible()) {
    await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
    await unlock.click();
  }
  const checkbox = page.getByRole('checkbox', { name: 'Comparer des longueurs : vue en classe' });
  async function setNotion(active: boolean) {
    if ((await checkbox.isChecked()) === active) return;
    const saved = page.waitForResponse(
      (res) => res.url().endsWith('/notions') && res.request().method() === 'PATCH',
    );
    await checkbox.setChecked(active);
    expect((await saved).ok()).toBe(true);
  }
  const pupil = await browser.newPage({ baseURL });
  const exercise = /Convertis en centimètres/;
  try {
    await setNotion(false);
    await login(pupil, baseURL!);
    await pupil.getByRole('button', { name: new RegExp(E2E_ACCOUNT.child) }).click();
    await pupil.getByRole('button', { name: /Mathématiques/ }).click();
    await expect(pupil.getByRole('button', { name: exercise })).toHaveCount(0);
    await pupil.getByRole('button', { name: /Comparer des longueurs/ }).click();
    await expect(pupil.getByRole('dialog', { name: 'Leçon' })).toContainText('1 m = 100 cm');
    await pupil.getByRole('button', { name: /J’ai compris/ }).click();

    await pupil.getByRole('button', { name: /Mélange : je choisis/ }).click();
    const picker = pupil.getByRole('dialog', { name: 'Mélange' });
    await expect(picker.getByRole('checkbox', { name: /Comparer des longueurs/ })).toHaveCount(0);
    await picker.getByRole('button', { name: 'Annuler' }).click();

    await pupil.goto('/#/exercise/maths.mesures.convertis-longueur');
    await expect(pupil.getByRole('alert')).toContainText('Cet exercice n’est pas disponible');
    await pupil.getByRole('button', { name: /Retour/ }).click();
    await expect(pupil.getByRole('heading', { name: /Mathématiques/ })).toBeVisible();

    await pupil.goto('/#/mix?n=maths.mesures.comparer-longueurs');
    await expect(pupil.getByRole('alert')).toContainText('Aucun exercice disponible');
    await pupil.goto('/#/mix?n=');
    await expect(pupil.getByRole('alert')).toContainText('Aucun exercice disponible');
    await pupil.goto('/#/dev/gallery');
    await expect(pupil).toHaveURL(/#\/home$/);

    await setNotion(true);
    await pupil.getByRole('button', { name: /Mathématiques/ }).click();
    await pupil.getByRole('button', { name: exercise }).click();
    await expect(pupil.getByRole('heading', { name: exercise })).toBeVisible();
  } finally {
    await pupil.close();
    await setNotion(true);
  }
});
