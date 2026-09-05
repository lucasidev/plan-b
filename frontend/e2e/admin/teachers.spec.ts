import { expect, type Page, test } from '@playwright/test';
import { ADMIN, LUCIA, type Persona } from '../helpers/personas';

/**
 * E2E del backoffice de docentes: alta, edición, baja y reactivación, validación y acceso
 * (US-196, SC-027; #416).
 *
 * El ABM que corre hoy en `/admin/teachers*` es el catálogo heredado de la v1 (US-063, retirado:
 * `docs/history/domain-v1/stories/US-063.md`). Ninguna story vigente describe este CRUD punto por
 * punto (US-196 es la cátedra como entidad propia con su equipo cargado por nombre, y la
 * verificación contra ese nombre es su E3, confirmado ya por integration tests de backend); por
 * eso ningún test de acá cita un escenario E/N puntual, aunque la pantalla siga viva y con
 * tráfico real.
 *
 * Cada docente lo crea la propia corrida, con nombre y apellido únicos por sufijo random (mismo
 * patrón que `careers.spec.ts` / `subjects.spec.ts`): un spec no puede pisar los datos que otro lee.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';
const UNSTA_NAME = 'Universidad del Norte Santo Tomás de Aquino';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

async function signIn(page: Page, persona: Persona) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

/** La fila de un docente en la tabla admin, ubicada por su sufijo (único por corrida). */
function teacherRow(page: Page, suffix: string) {
  return page.locator('.border-line-2').filter({ hasText: new RegExp(suffix, 'i') });
}

/** Docente descartable de esta corrida, creado por API (es setup, no el flujo bajo prueba). */
async function createTeacherViaApi(page: Page, suffix: string): Promise<string> {
  const response = await page.request.post('/api/academic/teachers', {
    data: {
      universityId: UNSTA_ID,
      firstName: `Ada${suffix}`,
      lastName: `Lovelace${suffix}`,
      title: 'Titular',
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).id as string;
}

/** El id del docente recién creado por la UI, leído del listado admin (nombres en title case). */
async function teacherIdByFullName(
  page: Page,
  firstName: string,
  lastName: string,
): Promise<string> {
  const response = await page.request.get('/api/academic/teachers');
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    items: { id: string; firstName: string; lastName: string }[];
  };
  const found = body.items.find(
    (t) =>
      t.firstName.toLowerCase() === firstName.toLowerCase() &&
      t.lastName.toLowerCase() === lastName.toLowerCase(),
  );
  if (!found) throw new Error(`no apareció el docente ${firstName} ${lastName} en el listado`);
  return found.id;
}

test.describe('Backoffice de docentes: alta, edición, baja y acceso', () => {
  // Igual que chairs/careers/subjects: el dev server compila cada ruta la primera vez que la
  // pisa, y este archivo pisa seis rutas distintas.
  test.setTimeout(120_000);

  let createdTeacherIds: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const id of createdTeacherIds) {
      await page.request.delete(`/api/academic/teachers/${id}`).catch(() => {});
    }
    createdTeacherIds = [];
  });

  test('el admin da de alta un docente y aparece en el listado con su universidad y su cargo', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    const suffix = randomSuffix();
    const firstName = `Ada${suffix}`;
    const lastName = `Lovelace${suffix}`;

    await page.goto('/admin/teachers/new');
    await expect(page.getByRole('heading', { name: /nuevo docente/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/universidad/i).selectOption(UNSTA_ID);
    await page.getByLabel(/^nombre$/i).fill(firstName);
    await page.getByLabel(/^apellido$/i).fill(lastName);
    await page.getByLabel(/^cargo$/i).fill('Titular');
    await page.getByRole('button', { name: /crear docente/i }).click();

    await expect(page).toHaveURL(/\/admin\/teachers$/, { timeout: 30_000 });
    createdTeacherIds.push(await teacherIdByFullName(page, firstName, lastName));

    const row = teacherRow(page, suffix);
    await expect(row.getByText(UNSTA_NAME)).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText('Titular', { exact: true })).toBeVisible();
  });

  test('editar el apellido lo actualiza en la tabla y en la ficha pública del docente', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    const suffix = randomSuffix();
    const teacherId = await createTeacherViaApi(page, suffix);
    createdTeacherIds.push(teacherId);

    const newSuffix = randomSuffix();
    await page.goto(`/admin/teachers/${teacherId}/edit`);
    await expect(page.getByRole('heading', { name: new RegExp(`Ada${suffix}`, 'i') })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/^apellido$/i).fill(`Lovelace${newSuffix}`);
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    await expect(page).toHaveURL(/\/admin\/teachers$/, { timeout: 30_000 });
    const row = teacherRow(page, suffix);
    await expect(row.getByText(new RegExp(`Lovelace${newSuffix}`, 'i'))).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/teachers/${teacherId}`);
    await expect(
      page.getByRole('heading', { name: new RegExp(`Ada${suffix} Lovelace${newSuffix}`, 'i') }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('dar de baja un docente hace que su ficha pública avise que ya no figura, y reactivarlo la devuelve', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    const suffix = randomSuffix();
    const teacherId = await createTeacherViaApi(page, suffix);
    createdTeacherIds.push(teacherId);

    await page.goto('/admin/teachers');
    const activeRow = teacherRow(page, suffix);
    await expect(activeRow.getByText(/^activo$/i)).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await activeRow.getByRole('button', { name: /^desactivar$/i }).click();
    await expect(activeRow.getByText(/^inactivo$/i)).toBeVisible({ timeout: 15_000 });

    await page.goto(`/teachers/${teacherId}`);
    await expect(page.getByText(/ya no figura en el catálogo/i)).toBeVisible();

    await page.goto('/admin/teachers');
    const inactiveRow = teacherRow(page, suffix);
    await inactiveRow.getByRole('button', { name: /^reactivar$/i }).click();
    await expect(inactiveRow.getByText(/^activo$/i)).toBeVisible({ timeout: 15_000 });

    await page.goto(`/teachers/${teacherId}`);
    await expect(page.getByRole('heading', { name: new RegExp(`Ada${suffix}`, 'i') })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('el alta sin apellido no crea el docente y la pantalla lo dice', async ({ page }) => {
    await signIn(page, ADMIN);

    await page.goto('/admin/teachers/new');
    await expect(page.getByRole('heading', { name: /nuevo docente/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/universidad/i).selectOption(UNSTA_ID);
    await page.getByLabel(/^nombre$/i).fill(`Ada${randomSuffix()}`);
    // Un espacio pasa el `required` nativo del input (longitud > 0), pero el trim del schema del
    // server action lo rechaza igual: es el camino real a la validación propia, no a la del navegador.
    await page.getByLabel(/^apellido$/i).fill(' ');
    await page.getByRole('button', { name: /crear docente/i }).click();

    await expect(page.locator('form').getByRole('alert')).toContainText(
      /el apellido es obligatorio/i,
    );
    await expect(page).toHaveURL(/\/admin\/teachers\/new$/);
  });

  test('sin sesión, /admin/teachers redirige a sign-in', async ({ page }) => {
    await page.goto('/admin/teachers');
    await expect(page).toHaveURL(/\/sign-in$/, { timeout: 15_000 });
  });

  test('como member, /admin/teachers no se ve: la sesión activa lo manda a su home', async ({
    page,
  }) => {
    // El guard de `(staff)` manda a `/sign-in`, pero la sesión de member ya está activa: el
    // guard de `(auth)` la ve ahí y rebota de nuevo, a `roleHomePath('member')` (ADR-0019). El
    // encadenado termina en `/home`, no en `/sign-in`.
    await signIn(page, LUCIA);
    await page.goto('/admin/teachers');
    await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  });
});
