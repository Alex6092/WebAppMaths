import { expect, test, type Browser, type Page } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

const PASSWORD = 'e2e-ecole-mot-de-passe';

/** Une page dans un navigateur neuf (pas de cookie : un autre appareil, une autre personne). */
async function freshPage(browser: Browser, page: Page): Promise<Page> {
  const context = await browser.newContext({
    ...(page.viewportSize() ? { viewport: page.viewportSize()! } : {}),
    baseURL: new URL(page.url()).origin,
  });
  return context.newPage();
}

test('une école : classe, élèves, fiche parent, devoir et avis vus par le parent', async ({
  page,
  browser,
}, testInfo) => {
  const tag = `${testInfo.project.name}-${Date.now()}`;

  // L'administrateur crée l'école dans son espace parent.
  await page.goto('/');
  await page.getByLabel('E-mail').fill(E2E_ACCOUNT.email);
  await page.getByLabel('Mot de passe').fill(E2E_ACCOUNT.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByRole('button', { name: /Espace parent/ }).click();
  await page.getByLabel('Nom de l’école').fill(`École ${tag}`);
  await page.getByRole('button', { name: 'Créer l’école' }).click();
  const directionCode = (await page
    .getByText(/Code de la direction/)
    .locator('xpath=following-sibling::p[1]')
    .textContent())!.trim();

  // La directrice crée son compte avec le lien, puis une classe et ses élèves.
  const teacher = await freshPage(browser, page);
  await teacher.goto(`/#/activer?code=${directionCode}`);
  await expect(
    teacher.getByRole('heading', { name: 'Créer votre compte enseignant' }),
  ).toBeVisible();
  await teacher.getByLabel('E-mail professionnel').fill(`direction-${tag}@exemple.test`);
  await teacher.getByLabel('Mot de passe (8 caractères minimum)').fill(PASSWORD);
  await teacher.getByLabel('Mot de passe, encore une fois').fill(PASSWORD);
  await teacher.getByRole('button', { name: 'Créer le compte' }).click();
  await expect(teacher.getByRole('heading', { name: new RegExp(`École ${tag}`) })).toBeVisible();

  await teacher.getByLabel('Nom', { exact: true }).fill('CE1 B');
  await teacher.getByRole('checkbox', { name: 'CP', exact: true }).uncheck();
  await teacher.getByRole('checkbox', { name: 'CE1', exact: true }).check();
  await teacher.getByRole('button', { name: 'Créer la classe' }).click();
  await expect(teacher.getByRole('heading', { name: 'CE1 B' })).toBeVisible();

  await teacher.getByLabel(/Un élève par ligne/).fill('Léo M.\nZoé D.');
  await teacher.getByRole('button', { name: 'Ajouter 2 élèves' }).click();
  await expect(teacher.getByRole('cell', { name: /Léo M\./ })).toBeVisible();

  // Les fiches parents, avec leur QR code.
  await teacher.getByRole('button', { name: 'Imprimer les fiches (2)' }).click();
  const sheets = teacher.getByRole('dialog', { name: 'Fiches parents' });
  await expect(sheets.getByRole('img', { name: 'QR code de Léo' })).toBeVisible();
  const leoCode = (await sheets
    .locator('article', { hasText: 'Léo' })
    .locator('.code')
    .textContent())!.trim();
  await sheets.getByRole('button', { name: 'Fermer' }).click();
  await expect(teacher.getByText(/Fiche du/).first()).toBeVisible();

  // La leçon en cours, un devoir pour la classe, une évaluation sur papier.
  await teacher.getByRole('link', { name: /Notions/ }).click();
  await teacher
    .getByRole('button', { name: /Tables de multiplication : en ce moment en classe/ })
    .click();
  await expect(teacher.getByText(/En ce moment :/)).toBeVisible();

  await teacher.getByRole('link', { name: /Devoirs/ }).click();
  await teacher.getByRole('button', { name: /Donner un devoir/ }).click();
  await teacher.getByLabel('Titre (facultatif)').fill('Tables de la semaine');
  await teacher.getByRole('checkbox', { name: /Tables de multiplication/ }).check();
  await teacher.getByRole('button', { name: 'Donner le devoir' }).click();
  await expect(teacher.getByText('Tables de la semaine')).toBeVisible();

  await teacher.getByRole('link', { name: /Évaluations/ }).click();
  await teacher.getByRole('button', { name: /Saisir une évaluation/ }).click();
  await teacher.getByLabel('Titre').fill('Évaluation des tables');
  await teacher.getByRole('checkbox', { name: /Tables de multiplication/ }).check();
  await teacher.getByRole('button', { name: 'Saisir les résultats' }).click();
  const cell = teacher.getByRole('button', { name: /^Léo, Tables de multiplication/ });
  await cell.click(); // A
  await cell.click(); // ECA
  await expect(cell).toHaveText('ECA');
  await teacher.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(teacher.getByText('Évaluation des tables')).toBeVisible();

  // Le parent de Léo scanne la fiche et crée son compte.
  const parent = await freshPage(browser, page);
  await parent.goto(`/#/activer?code=${leoCode}`);
  await expect(
    parent.getByRole('heading', { name: 'Activer le compte parent de Léo' }),
  ).toBeVisible();
  await parent.getByLabel('E-mail du parent').fill(`parent-${tag}@exemple.test`);
  await parent.getByLabel('Mot de passe (8 caractères minimum)').fill(PASSWORD);
  await parent.getByLabel('Mot de passe, encore une fois').fill(PASSWORD);
  await parent.getByRole('button', { name: 'Créer le compte' }).click();
  await expect(parent.getByRole('heading', { name: 'Espace parent' })).toBeVisible();
  // Le bilan : la leçon en cours et l'avis de l'enseignante.
  await expect(parent.getByRole('heading', { name: /En ce moment en classe/ })).toBeVisible();
  await expect(parent.getByText('🏫 ECA').first()).toBeVisible();
  await expect(parent.getByText(/Tables de la semaine/)).toBeVisible();

  // Léo, à la maison : le devoir de la classe et la leçon en cours.
  await parent.getByRole('button', { name: '⬅️ Retour' }).click();
  await parent.getByRole('button', { name: /Léo/ }).click();
  await expect(parent.getByText('🏫 Tables de la semaine')).toBeVisible();
  await expect(parent.getByText(/En ce moment en classe/)).toBeVisible();
  await expect(parent.getByRole('button', { name: /À retravailler/ })).toBeVisible();

  // L'enseignante voit que Léo a un compte parent.
  await teacher.getByRole('link', { name: /Élèves/ }).click();
  await expect(teacher.getByRole('row', { name: /Léo/ }).getByText('✅ Activé')).toBeVisible();
});
