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

test.describe('Cargar una cátedra desde el backoffice (US-196)', () => {
  // El recorrido pasa por cuatro pantallas del backoffice y la ficha pública; sobre el dev
  // server, que compila cada ruta la primera vez, tarda entre 20 y 40 segundos solo y agota los
  // 60 por default cuando corre con la suite entera.
  test.setTimeout(120_000);

  // US-196 E4: materia, cátedra, equipo y retorno con contexto.
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

    await expect(
      page
        .getByRole('navigation', { name: 'Ruta de navegación' })
        .locator(`a[href="/admin/universities/${UNSTA_ID}"]`),
    ).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Ruta de navegación' })).toContainText(
      'Plan 2018',
    );
    await expect(page.getByText('Sin equipo cargado todavía.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/chairs\/[a-f0-9-]+\?subjectId=/);
    const chairId = new URL(page.url()).pathname.split('/').at(-1) ?? '';

    await page.getByRole('combobox', { name: 'Rol', exact: true }).selectOption('Lead');
    await page.getByLabel('Desde qué período').selectOption(UNSTA_TERM);
    await page.getByRole('link', { name: 'Cargar un docente que falta' }).click();
    await expect(page.getByLabel('Universidad', { exact: true })).toHaveValue(UNSTA_ID);
    await page.getByLabel('Nombre', { exact: true }).fill(`Ada${suffix}`);
    await page.getByLabel('Apellido', { exact: true }).fill(`Lovelace${suffix}`);
    await page.getByRole('button', { name: 'Crear docente', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/chairs/${chairId}`));
    await expect(page.getByRole('combobox', { name: 'Rol', exact: true })).toHaveValue('Lead');
    await expect(page.getByLabel('Desde qué período')).toHaveValue(UNSTA_TERM);
    await page
      .getByLabel('Docente', { exact: true })
      .selectOption({ label: `Lovelace${suffix}, Ada${suffix}` });
    await page.getByRole('button', { name: 'Agregar integrante', exact: true }).click();
    const current = page.getByRole('region', { name: 'Equipo actual', exact: true });
    await expect(current).toContainText(`Ada${suffix}`);
    await expect(current).toContainText('Titular');
    await current.getByRole('button', { name: 'Cerrar tramo' }).click();
    await current.getByLabel('Último período que integró').selectOption(UNSTA_TERM_LATER);
    await current.getByRole('button', { name: 'Confirmar cierre' }).click();
    await expect(page.getByRole('region', { name: 'Integraron antes' })).toContainText(
      `Ada${suffix}`,
    );
    await page.getByRole('link', { name: /Volver a las cátedras/ }).click();
    await expect(page).toHaveURL(`/admin/chairs?subjectId=${SUBJECT_211}`);

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

    await page.getByRole('link', { name: /Volver a las cátedras/ }).click();
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
