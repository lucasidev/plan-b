import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E del alta de universidades desde el backoffice (US-191, US-203; #416).
 *
 * El ABM que corre hoy en `/admin/universities*` es el catálogo heredado de la v1 (US-060,
 * retirado). US-191 describe la pantalla de Catálogo rehecha por huecos y US-203 el arranque de
 * Pedidos: ninguna de las dos describe este CRUD, así que ningún test de acá cita un escenario E/N
 * puntual de esas dos stories.
 *
 * La única cita indirecta es la del catálogo público: US-171 marca "No construido" el orden
 * elegible (alfabético/por voces, sin destacados), pero su propia nota dice que universidades y
 * carreras salen hoy por nombre. Eso sí es afirmable, y es lo que se verifica acá, sin citar E1
 * (citarlo sería una marca caduca: `check-scenarios.ts` la marcaría, porque el escenario completo
 * -incluido "no ofrece elegir el orden"- sigue sin construir).
 */

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

/**
 * La fila de una universidad en la tabla admin, ubicada por su sufijo (único por corrida).
 * Acotada al contenedor de esa tabla: R6 sumó a esta misma pantalla el panel de auditorías AGN
 * (issue #506), que lista las mismas instituciones en su propia tabla con la misma clase de fila,
 * así que un localizador sin acotar resuelve dos elementos por universidad.
 */
function universityRow(page: Page, suffix: string) {
  const table = page.getByText('Dominios institucionales', { exact: true }).locator('xpath=../..');
  return table.locator('.border-line-2').filter({ hasText: new RegExp(suffix, 'i') });
}

/** El id de la universidad recién creada, leído del listado admin (no vuelve en el redirect del form). */
async function universityIdBySlug(page: Page, slug: string): Promise<string> {
  const response = await page.request.get('/api/academic/universities/admin');
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { items: { id: string; slug: string }[] };
  const found = body.items.find((u) => u.slug === slug);
  if (!found) throw new Error(`no apareció la universidad de slug ${slug} en el listado admin`);
  return found.id;
}

test.describe('Alta de universidades desde el backoffice (US-191, US-203)', () => {
  test.setTimeout(120_000);

  let createdUniversityIds: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const id of createdUniversityIds) {
      await page.request.delete(`/api/academic/universities/${id}`).catch(() => {});
    }
    createdUniversityIds = [];
  });

  test('el admin afilia una universidad y aparece en el backoffice y en el catálogo público, en su lugar alfabético', async ({
    page,
  }) => {
    await signIn(page, ADMIN);

    const suffix = randomSuffix();
    // Arranca con "0": ordena antes que "Universidad ..." (las cuatro seed) bajo cualquier
    // collation real, así que su posición en /universities no depende de cómo esa collation
    // resuelva mayúsculas o acentos entre los nombres existentes.
    const name = `0-E2E Universidad ${suffix}`;
    const slug = `e2e-uni-${suffix.toLowerCase()}`;
    const domain = `e2e-${suffix.toLowerCase()}.edu.ar`;

    await page.goto('/admin/universities/new');
    await expect(page.getByRole('heading', { name: /afiliar universidad/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/^nombre$/i).fill(name);
    await page.getByLabel(/^slug$/i).fill(slug);
    await page.getByLabel(/dominios institucionales/i).fill(domain);
    await page.getByRole('button', { name: /^agregar$/i }).click();
    // Sin exact: true. El chip es un solo <span> con el dominio y el botón "Quitar" adentro, así
    // que su texto completo es "{domain}×" (la × del botón), no el dominio solo.
    await expect(page.getByText(domain)).toBeVisible();

    await page.getByRole('button', { name: /afiliar universidad/i }).click();

    await expect(page).toHaveURL(/\/admin\/universities$/, { timeout: 30_000 });
    createdUniversityIds.push(await universityIdBySlug(page, slug));

    const row = universityRow(page, suffix);
    await expect(row.getByText(name, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(domain, { exact: true })).toBeVisible();

    // Catálogo público: sigue ordenado por nombre, con la nueva adentro y primera. Sin
    // toHaveText: cada fila también trae la cobertura de carreras (US-222) debajo del nombre.
    await page.goto('/universities');
    await expect(page.getByRole('listitem').first().getByText(name, { exact: true })).toBeVisible();
  });

  test('un slug repetido no crea la universidad y la pantalla lo dice', async ({ page }) => {
    await signIn(page, ADMIN);

    await page.goto('/admin/universities/new');
    await expect(page.getByRole('heading', { name: /afiliar universidad/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/^nombre$/i).fill(`Universidad Duplicada ${randomSuffix()}`);
    // "unsta" es el slug de la universidad seed: siempre está tomado.
    await page.getByLabel(/^slug$/i).fill('unsta');
    await page.getByRole('button', { name: /afiliar universidad/i }).click();

    await expect(page.locator('form').getByRole('alert')).toContainText(/ese slug ya está en uso/i);
    await expect(page).toHaveURL(/\/admin\/universities\/new$/);
  });
});
