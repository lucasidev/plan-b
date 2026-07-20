import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E para US-062 (backoffice de materias de un plan + correlativas).
 *
 * Corre sobre el plan seedeado de la TUDCS (UNSTA), pero **crea sus propias materias** con códigos
 * random en vez de reusar las 15 del seed. Dos razones: la unicidad es (career_plan, code), y sobre
 * todo las correlativas son una tripla única, así que reusar materias fijas haría que la segunda
 * corrida choque con `already_exists` en vez de probar lo que quiere probar.
 *
 * El segundo test es el que justifica la US: que el rechazo de ciclos del domain service llegue
 * hasta la UI. El unit test cubre el DFS; esto cubre que el 409 viaje y se muestre entendible.
 *
 * No hace falta esperar la hidratación a mano: los botones de submit arrancan deshabilitados y se
 * habilitan al hidratar (`useHydrated`), así que el `click` de Playwright ya espera por ser
 * accionable. Antes esto necesitaba `networkidle` y reintentos.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';
const TUDCS_CAREER_ID = '00000002-0000-4000-a000-000000000003';
const TUDCS_PLAN_2018_ID = '00000003-0000-4000-a000-000000000003';

const SUBJECTS_URL = `/admin/universities/${UNSTA_ID}/careers/${TUDCS_CAREER_ID}/plans/${TUDCS_PLAN_2018_ID}/subjects`;

/** Sufijo random para que las materias de cada corrida no choquen entre sí ni con el seed. */
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

/** Da de alta una materia y la deja verificada en el listado del plan. */
async function createSubject(page: Page, name: string, code: string) {
  await page.goto(`${SUBJECTS_URL}/new`);
  await expect(page.getByRole('heading', { name: /nueva materia/i })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByLabel(/nombre de la materia/i).fill(name);
  await page.getByLabel(/^código$/i).fill(code);
  await page.getByLabel(/año del plan/i).fill('1');
  await page.getByLabel(/^cadencia$/i).selectOption('Cuatrimestral');
  await page.getByLabel(/cuatrimestre \/ bimestre/i).fill('1');
  await page.getByLabel(/carga horaria semanal/i).fill('6');
  await page.getByLabel(/carga horaria total/i).fill('96');
  await page.getByRole('button', { name: /crear materia/i }).click();

  // El alta redirige al listado (useEffect sobre el success del action, ADR-0046).
  await expect(page).toHaveURL(new RegExp(`${SUBJECTS_URL}$`), { timeout: 30_000 });
  await expect(page.getByText(code, { exact: true })).toBeVisible({ timeout: 30_000 });
}

/**
 * Elige la arista (materia requiere correlativa) en el panel, siempre en tipo "para cursar".
 * Afirma la selección efectiva de cada select: los tres son controlados por estado, y una selección
 * que no cuajara mandaría una arista distinta de la que pide el test, fallando con un error
 * engañoso en vez de con el motivo real.
 */
async function selectEdge(page: Page, subjectOption: string, requiredOption: string) {
  const subject = page.getByLabel(/^materia$/i);
  await subject.selectOption({ label: subjectOption });
  await expect(subject.locator('option:checked')).toHaveText(subjectOption);

  const required = page.getByLabel(/^correlativa$/i);
  await required.selectOption({ label: requiredOption });
  await expect(required.locator('option:checked')).toHaveText(requiredOption);

  await page.getByLabel(/^tipo$/i).selectOption('ParaCursar');
}

test.describe('Backoffice de materias y correlativas (US-062)', () => {
  test.setTimeout(180_000);

  test('el admin da de alta una materia y la ve en el listado del plan', async ({ page }) => {
    await signIn(page, ADMIN);

    const code = `TST${randomSuffix()}`;
    await createSubject(page, `Materia de prueba ${code}`, code);

    await expect(page.getByText(code, { exact: true })).toBeVisible();
  });

  test('el sistema rechaza una correlativa que cerraría un ciclo', async ({ page }) => {
    await signIn(page, ADMIN);

    // Dos materias nuevas del mismo plan: A y B. El option del select se arma como
    // `{code} · {name}` (ver prerequisites-panel), así que lo reconstruimos para elegirlo exacto.
    const codeA = `CYA${randomSuffix()}`;
    const codeB = `CYB${randomSuffix()}`;
    const nameA = `Ciclo A ${codeA}`;
    const nameB = `Ciclo B ${codeB}`;
    const optionA = `${codeA} · ${nameA}`;
    const optionB = `${codeB} · ${nameB}`;
    await createSubject(page, nameA, codeA);
    await createSubject(page, nameB, codeB);

    await page.goto(SUBJECTS_URL);
    await expect(page.getByRole('heading', { name: /^correlativas$/i })).toBeVisible({
      timeout: 30_000,
    });

    // A requiere B (para cursar): arista válida, el grafo sigue acíclico.
    await selectEdge(page, optionA, optionB);
    await page.getByRole('button', { name: /agregar correlativa/i }).click();

    // La arista aparece en la lista sin recargar (invalidateQueries en el success del action).
    await expect(
      page.getByRole('button', { name: new RegExp(`quitar correlativa.*${codeA}.*${codeB}`, 'i') }),
    ).toBeVisible({ timeout: 30_000 });

    // Ahora B requiere A en el MISMO type: cierra el ciclo y el domain service tiene que frenarlo.
    await selectEdge(page, optionB, optionA);
    await page.getByRole('button', { name: /agregar correlativa/i }).click();

    // El mensaje tiene que hablar de ciclo, no ser un error genérico: es lo que le explica al admin
    // por qué no puede cargar esa correlativa. Apuntamos al <p role="alert"> del form y no a
    // getByRole('alert') a secas, que también matchea el route announcer de Next.
    await expect(page.locator('p[role="alert"]')).toContainText(/ciclo/i, { timeout: 30_000 });
  });
});
