import { expect, test, type APIRequestContext } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

const PASSWORD = 'e2e-reinit-mot-de-passe';
const NEW_PASSWORD = 'e2e-nouveau-mot-de-passe';

async function call<T>(request: APIRequestContext, method: string, url: string, data?: unknown) {
  const res = await request.fetch(`/api/${url}`, { method, data });
  expect(res.ok(), `${method} ${url} : ${await res.text()}`).toBe(true);
  return (await res.json()) as T;
}

test('mot de passe oublié : la direction imprime la fiche, le parent choisit un nouveau mot de passe', async ({
  page,
  browser,
  playwright,
}, testInfo) => {
  const tag = `${testInfo.project.name}-${Date.now()}`;
  const baseURL = testInfo.project.use.baseURL!;
  const parentEmail = `parent-reinit-${tag}@exemple.test`;

  // Préparation par l'API : une école, sa directrice, une classe et Léo, rattaché à sa famille.
  const admin = await playwright.request.newContext({ baseURL });
  await call(admin, 'POST', 'auth/login', {
    email: E2E_ACCOUNT.email,
    password: E2E_ACCOUNT.password,
  });
  const school = await call<{ id: number; invitation: { code: string } }>(
    admin,
    'POST',
    'admin/schools',
    { name: `École ${tag}` },
  );
  await call(page.request, 'POST', 'auth/register', {
    code: school.invitation.code,
    email: `direction-reinit-${tag}@exemple.test`,
    password: PASSWORD,
  });
  const classroom = await call<{ id: number }>(
    page.request,
    'POST',
    `schools/${school.id}/classes`,
    { name: 'CE1 B', grades: ['CE1'] },
  );
  const [leo] = await call<{ id: number }[]>(
    page.request,
    'POST',
    `classes/${classroom.id}/pupils`,
    {
      pupils: [{ firstName: 'Léo' }],
    },
  );
  const [code] = await call<{ code: string }[]>(
    page.request,
    'POST',
    `classes/${classroom.id}/pupil-codes`,
    { pupilIds: [leo!.id] },
  );
  const parentApi = await playwright.request.newContext({ baseURL });
  await call(parentApi, 'POST', 'auth/register', {
    code: code!.code,
    email: parentEmail,
    password: PASSWORD,
  });

  // La directrice imprime la fiche « Accès parent oublié ».
  await page.goto(`/#/ecole/${school.id}/classe/${classroom.id}`);
  await page.getByRole('row', { name: /Léo/ }).getByRole('button', { name: 'Modifier' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Accès parent oublié/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Fiche de réinitialisation' });
  await expect(sheet.getByRole('img', { name: 'QR code de réinitialisation' })).toBeVisible();
  const resetCode = (await sheet.locator('.code').textContent())!.trim();

  // Le parent : « Mot de passe oublié ? » depuis la connexion, puis le code de la fiche.
  const context = await browser.newContext({ baseURL });
  const parent = await context.newPage();
  await parent.goto('/');
  await parent.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
  await parent.getByLabel('Code de la fiche').fill(resetCode);
  await parent.getByRole('button', { name: 'Continuer' }).click();
  await expect(parent.getByText(/pour un parent de Léo/)).toBeVisible();
  await parent.getByLabel('Ton e-mail (celui du compte)').fill(parentEmail);
  await parent.getByLabel('Nouveau mot de passe (8 caractères minimum)').fill(NEW_PASSWORD);
  await parent.getByLabel('Nouveau mot de passe, encore une fois').fill(NEW_PASSWORD);
  await parent.getByRole('button', { name: 'Changer le mot de passe' }).click();
  await expect(parent.getByRole('heading', { name: 'Qui travaille aujourd’hui ?' })).toBeVisible();

  // L'ancien appareil est déconnecté ; le nouveau mot de passe marche.
  expect((await parentApi.get('/api/auth/me')).status()).toBe(401);
  const again = await playwright.request.newContext({ baseURL });
  await call(again, 'POST', 'auth/login', { email: parentEmail, password: NEW_PASSWORD });
  await Promise.all([admin.dispose(), parentApi.dispose(), again.dispose(), context.close()]);
});
