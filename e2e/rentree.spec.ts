import { expect, test, type APIRequestContext } from '@playwright/test';
import { E2E_ACCOUNT } from './fixtures';

const PASSWORD = 'e2e-rentree-mot-de-passe';

/** Un appel à l'API ; renvoie le JSON (la requête doit réussir). */
async function call<T>(request: APIRequestContext, method: string, url: string, data?: unknown) {
  const res = await request.fetch(`/api/${url}`, { method, data });
  expect(res.ok(), `${method} ${url} : ${await res.text()}`).toBe(true);
  return (await res.json()) as T;
}

test('la direction répartit la classe et fait la rentrée', async ({
  page,
  playwright,
}, testInfo) => {
  const tag = `${testInfo.project.name}-${Date.now()}`;
  const baseURL = testInfo.project.use.baseURL!;
  const api = () => playwright.request.newContext({ baseURL });

  // Préparation par l'API : une école, sa directrice, une classe de cette année et deux élèves.
  const admin = await api();
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
    email: `direction-rentree-${tag}@exemple.test`,
    password: PASSWORD,
  });
  const classroom = await call<{ id: number }>(
    page.request,
    'POST',
    `schools/${school.id}/classes`,
    {
      name: 'CE1 B',
      grades: ['CE1'],
    },
  );
  const pupils = await call<{ id: number; firstName: string }[]>(
    page.request,
    'POST',
    `classes/${classroom.id}/pupils`,
    { pupils: [{ firstName: 'Léo' }, { firstName: 'Zoé' }] },
  );
  const [code] = await call<{ code: string }[]>(
    page.request,
    'POST',
    `classes/${classroom.id}/pupil-codes`,
    { pupilIds: [pupils[0]!.id] },
  );
  const parent = await api();
  await call(parent, 'POST', 'auth/register', {
    code: code!.code,
    email: `parent-rentree-${tag}@exemple.test`,
    password: PASSWORD,
  });

  // La directrice crée la classe de l'année prochaine.
  await page.goto(`/#/ecole/${school.id}`);
  await page.getByLabel('Nom', { exact: true }).fill('CE2 A');
  // L'année suivante (la seconde de la liste).
  await page.getByLabel('Année').selectOption({ index: 1 });
  await page.getByRole('checkbox', { name: 'CP', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'CE2', exact: true }).check();
  await page.getByRole('button', { name: 'Créer la classe' }).click();
  await expect(page.getByRole('heading', { name: 'CE2 A' })).toBeVisible();

  // Onglet Rentrée : toute la classe en CE2 A, Zoé quitte l'école.
  await page.goto(`/#/ecole/${school.id}?onglet=rentree`);
  await page.getByLabel('Toute la classe CE1 B').selectOption({ label: '→ CE2 A' });
  await expect(page.getByLabel('Niveau de Léo à la rentrée')).toHaveValue('CE2');
  await page.getByLabel('Rentrée de Zoé').selectOption({ label: 'Quitte l’école' });
  await expect(page.getByText('profil supprimé')).toBeVisible();
  await expect(page.getByText(/0 à répartir/)).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Faire la rentrée/ }).click();
  await expect(page.getByText(/Rentrée faite/)).toBeVisible();

  // Léo est en CE2 A, au niveau CE2 ; l'ancienne classe a disparu.
  const me = await call<{ children: { grade: string; classroom: { name: string } | null }[] }>(
    parent,
    'GET',
    'auth/me',
  );
  expect(me.children).toMatchObject([{ grade: 'CE2', classroom: { name: 'CE2 A' } }]);
  await page.goto(`/#/ecole/${school.id}`);
  await expect(page.getByRole('link', { name: /CE2 A/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /CE1 B/ })).toHaveCount(0);
  await admin.dispose();
  await parent.dispose();
});
