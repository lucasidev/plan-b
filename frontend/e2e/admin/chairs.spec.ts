import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E de cargar una cátedra desde el backoffice (US-196, #370).
 *
 * Es el criterio del issue, textual: se carga una cátedra nueva, se le suma y se le cierra un
 * integrante, y **la ficha pública la muestra sin tocar el seed**. Hasta esta pieza las cátedras
 * existían solo porque las sembraba el seed, así que todo lo que R1 y R2 construyeron operaba sobre
 * tres filas cargadas a mano.
 *
 * Trabaja sobre la materia 211 del seed, que es la única con cátedras, pero **crea la suya** con un
 * nombre random: un spec no puede pisar los datos que otros specs leen.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';
const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
const UNSTA_TERM = '00000005-0000-4000-a000-000000000001';
const UNSTA_TERM_LATER = '00000005-0000-4000-a000-000000000002';
const TUDCS_SUBJECTS =
  '/admin/universities/00000001-0000-4000-a000-000000000001' +
  '/careers/00000002-0000-4000-a000-000000000003' +
  '/plans/00000003-0000-4000-a000-000000000003/subjects';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function signIn(page: Page, persona: typeof ADMIN) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

/** Docente descartable de esta corrida. Es setup, no el flujo bajo prueba, así que va por API. */
async function createTeacher(page: Page, suffix: string): Promise<string> {
  const response = await page.request.post('/api/academic/teachers', {
    data: {
      universityId: UNSTA_ID,
      firstName: `Ada${suffix}`,
      lastName: `Lovelace${suffix}`,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}

test.describe('Cargar una cátedra desde el backoffice (US-196)', () => {
  test('se carga una cátedra, se le suma y se le cierra un integrante, y la ficha pública la muestra', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    const suffix = randomSuffix();
    const chairName = `Test${suffix}`;

    await page.goto(`/admin/chairs?subjectId=${SUBJECT_211}`);

    // 1. El alta, por la pantalla real y no por API: es lo que el issue pide verificar.
    await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
    await page.getByRole('button', { name: /cargar cátedra/i }).click();

    const chairRow = page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') });
    await expect(chairRow).toBeVisible({ timeout: 15_000 });

    // Todo lo que sigue se afirma sobre ESTA cátedra y no sobre la pantalla: la materia acumula
    // cátedras de otras corridas, y un locator suelto ("Integraron antes") las matchea a todas.
    const chairCard = page.getByRole('listitem').filter({
      has: page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') }),
    });

    // 2. El equipo. La UI de sumar integrantes no está construida todavía, así que este paso va por
    //    API contra los endpoints que sí lo están: lo que el issue exige verificar de punta a punta
    //    es que la cátedra cargada llegue a la ficha pública.
    const chairId = await chairIdByName(page, chairName);
    const teacherId = await createTeacher(page, suffix);

    const added = await page.request.post(`/api/academic/chairs/${chairId}/members`, {
      data: { teacherId, role: 'Lead', sinceTermId: UNSTA_TERM },
    });
    expect(added.status()).toBe(204);

    await page.reload();
    await expect(chairCard.getByText(new RegExp(`Ada${suffix}`, 'i'))).toBeVisible();
    await expect(chairCard.getByText(/titular/i)).toBeVisible();

    // 3. Cerrar el tramo no borra al docente: sigue listado, ahora entre los que integraron antes.
    const closed = await page.request.post(
      `/api/academic/chairs/${chairId}/members/${teacherId}/close`,
      { data: { untilTermId: UNSTA_TERM_LATER } },
    );
    expect(closed.status()).toBe(204);

    await page.reload();
    await expect(chairCard.getByText(/integraron antes/i)).toBeVisible();
    await expect(chairCard.getByText(new RegExp(`Ada${suffix}`, 'i'))).toBeVisible();

    // 4. Y el criterio del issue: la ficha pública la muestra, sin haber tocado el seed.
    await page.goto(`/chairs/${chairId}`);
    await expect(
      page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') }),
    ).toBeVisible();
  });

  test('dos cátedras de la misma materia no pueden compartir nombre', async ({ page }) => {
    await signIn(page, ADMIN);

    const chairName = `Dup${randomSuffix()}`;
    await page.goto(`/admin/chairs?subjectId=${SUBJECT_211}`);

    await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
    await page.getByRole('button', { name: /cargar cátedra/i }).click();
    await expect(
      page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
    await page.getByRole('button', { name: /cargar cátedra/i }).click();

    // El alert se busca dentro del form: `getByRole('alert')` suelto también matchea el
    // `__next-route-announcer__` de Next, que está en toda página.
    //
    // El mensaje dice qué pasó, no "algo salió mal": es lo que le permite a quien carga corregirse.
    await expect(page.locator('form').getByRole('alert')).toContainText(
      /ya hay una cátedra con ese nombre/i,
    );
  });

  test('sin materia elegida la pantalla ofrece el buscador', async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto('/admin/chairs');

    await expect(page.getByLabel(/buscá la materia/i)).toBeVisible();
  });

  /**
   * La cátedra es de una materia, así que el camino natural es entrar desde ella. El buscador de
   * /admin/chairs existe como atajo, no como único camino: quien está parado en una materia no
   * tendría que ir a otra pantalla a buscar la materia de la que viene.
   */
  test('se entra a las cátedras de una materia desde la materia', async ({ page }) => {
    await signIn(page, ADMIN);
    await page.goto(TUDCS_SUBJECTS);

    const toChairs = page.locator('a[href*="/admin/chairs?subjectId="]').first();
    await expect(toChairs).toBeVisible();
    await toChairs.click();

    await expect(page).toHaveURL(/\/admin\/chairs\?subjectId=/);
    await expect(page.getByRole('heading', { name: 'Cátedras', level: 1 })).toBeVisible();

    // Y llega con la materia ya elegida: se ve el alta, no el buscador vacío.
    await expect(page.getByLabel(/nombre de la cátedra/i)).toBeVisible();
  });
});

/** El id de la cátedra recién creada, leído del listado del backoffice. */
async function chairIdByName(page: Page, name: string): Promise<string> {
  const response = await page.request.get(`/api/academic/chairs?subjectId=${SUBJECT_211}`);
  expect(response.status()).toBe(200);
  const chairs = (await response.json()) as { id: string; name: string }[];
  const found = chairs.find((c) => c.name === name);
  expect(found, `no apareció la cátedra ${name} en el listado`).toBeTruthy();
  return found!.id;
}
