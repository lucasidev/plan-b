import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';

/**
 * E2E para US-062 (backoffice de materias de un plan + correlativas).
 *
 * Cada corrida trabaja sobre **su propio plan descartable**, no sobre el plan seedeado de la TUDCS.
 * La primera versión de este spec creaba materias en el plan real y las dejaba ahí: aparecían
 * después en el catálogo público y en el simulador de cualquier alumno (US-016), como datos
 * fantasma tipo "Ciclo A CYA83IXI". Un spec no puede ensuciar los datos que otros consumen.
 *
 * La carrera se archiva al final (soft delete), así que el plan y sus materias dejan de ofrecerse.
 *
 * No hace falta esperar la hidratación a mano: los botones de submit arrancan deshabilitados y se
 * habilitan al hidratar (`useHydrated`), así que el `click` de Playwright ya espera por ser
 * accionable.
 */

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';

/** Sufijo random para que las materias y el slug de cada corrida no choquen entre sí. */
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

type DisposablePlan = { careerId: string; planId: string; subjectsUrl: string };

/**
 * Crea una carrera + plan propios de esta corrida vía API (es setup, no el flujo bajo prueba).
 * Requiere sesión de admin ya iniciada en la page.
 */
async function createDisposablePlan(page: Page): Promise<DisposablePlan> {
  const tag = randomSuffix();

  const careerResp = await page.request.post(`/api/academic/universities/${UNSTA_ID}/careers`, {
    data: { name: `E2E Materias ${tag}`, slug: `e2e-materias-${tag.toLowerCase()}` },
  });
  expect(careerResp.ok(), 'no se pudo crear la carrera descartable').toBeTruthy();
  const careerId = ((await careerResp.json()) as { id: string }).id;

  // El año del plan no puede ser futuro (`CareerPlan.Create` lo rechaza con year_out_of_range: un
  // plan de estudios que todavía no empezó a regir no existe), así que usamos el año actual.
  const planResp = await page.request.post(`/api/academic/careers/${careerId}/plans`, {
    data: { year: new Date().getFullYear(), label: `plan-e2e-${tag.toLowerCase()}` },
  });
  expect(planResp.ok(), 'no se pudo crear el plan descartable').toBeTruthy();
  const planId = ((await planResp.json()) as { id: string }).id;

  return {
    careerId,
    planId,
    subjectsUrl: `/admin/universities/${UNSTA_ID}/careers/${careerId}/plans/${planId}/subjects`,
  };
}

/** Archiva la carrera creada. Idempotente: si ya no está, el error no importa. */
async function discardPlan(page: Page, careerId: string) {
  try {
    await page.request.delete(`/api/academic/careers/${careerId}`);
  } catch {
    // El cleanup no debe tumbar el test.
  }
}

/** Da de alta una materia en el plan de la corrida y la deja verificada en el listado. */
async function createSubject(page: Page, plan: DisposablePlan, name: string, code: string) {
  await page.goto(`${plan.subjectsUrl}/new`);
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
  await expect(page).toHaveURL(new RegExp(`${plan.subjectsUrl}$`), { timeout: 30_000 });
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

  let plan: DisposablePlan | null = null;

  test.afterEach(async ({ page }) => {
    if (!plan) return;
    await discardPlan(page, plan.careerId);
    plan = null;
  });

  test('el admin da de alta una materia y la ve en el listado del plan', async ({ page }) => {
    await signIn(page, ADMIN);
    plan = await createDisposablePlan(page);

    const code = `TST${randomSuffix()}`;
    await createSubject(page, plan, `Materia de prueba ${code}`, code);

    await expect(page.getByText(code, { exact: true })).toBeVisible();
  });

  test('el sistema rechaza una correlativa que cerraría un ciclo', async ({ page }) => {
    await signIn(page, ADMIN);
    plan = await createDisposablePlan(page);

    // Dos materias del plan de esta corrida: A y B. El option del select se arma como
    // `{code} · {name}` (ver prerequisites-panel), así que lo reconstruimos para elegirlo exacto.
    const codeA = `CYA${randomSuffix()}`;
    const codeB = `CYB${randomSuffix()}`;
    const nameA = `Ciclo A ${codeA}`;
    const nameB = `Ciclo B ${codeB}`;
    const optionA = `${codeA} · ${nameA}`;
    const optionB = `${codeB} · ${nameB}`;
    await createSubject(page, plan, nameA, codeA);
    await createSubject(page, plan, nameB, codeB);

    await page.goto(plan.subjectsUrl);
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
