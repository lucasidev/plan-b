import { expect, type Page, test } from '@playwright/test';
import { waitForMail } from '../helpers/mailpit';
import { ADMIN } from '../helpers/personas';

/**
 * El tramo con cuenta de "El recorrido para Copas" (pasos 5 a 7, `docs/engineering/deploy.md`),
 * automatizado contra el stage real (`https://planb.olisar.com.ar`, Mailpit en
 * `https://mail.olisar.com.ar`).
 *
 * No es E2E de regresión: `playwright.config.ts` la excluye de la suite salvo
 * `PLAYWRIGHT_INCLUDE_STAGE=1` (nunca en CI), y corre a mano con `just stage-walk`. No borra nada
 * al final: el reset (paso 8 del guion de clics) es manual.
 *
 * Corre a 180 s por test (`test.setTimeout`, como el resto de los specs de `admin/`) y sin retries.
 */

const STAGE_MAILPIT_URL = process.env.STAGE_MAILPIT_URL ?? 'https://mail.olisar.com.ar';

const SUBJECT_NAME = 'Fundamentos de Control de Calidad';
const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
const CHAIR_RUIZ = '00000008-0000-4000-a000-000000000003';
const UNSTA_ID = '00000001-0000-4000-a000-000000000001';
const TERM_2024_C1 = '00000005-0000-4000-a000-000000000001';

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** Correlaciona todo lo que esta corrida crea (cuenta, texto libre, cátedra, frase). */
const WALK_SUFFIX = randomSuffix();

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en .env: ${hint}`);
  }
  return value;
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
}

/**
 * La cascada Universidad → Carrera → Plan del `<CareerPicker>` en `/sign-up`. Duplica el helper de
 * `e2e/auth/sign-up.spec.ts`: un spec no importa de otro.
 */
async function fillCareerCascade(page: Page): Promise<void> {
  await page.getByLabel(/^universidad$/i).waitFor();
  await page
    .getByLabel(/^universidad$/i)
    .selectOption({ label: 'Universidad del Norte Santo Tomás de Aquino' });

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page
    .getByLabel(/^carrera$/i)
    .selectOption({ label: 'Tecnicatura Universitaria en Desarrollo y Calidad de Software' });

  await page.waitForFunction(() => {
    const sel = document.querySelector('select[name="careerPlanId"]') as HTMLSelectElement | null;
    return sel ? sel.options.length > 1 : false;
  });
  await page.getByLabel(/plan de estudios/i).selectOption({ index: 1 });
}

test.describe('El recorrido para Copas: cuenta, reseña y backoffice (docs/engineering/deploy.md)', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  let mailpitAuth: string;
  let seedPassword: string;
  let copasEmail: string;
  let copasPassword: string;
  let freeTextNote: string;

  test.beforeAll(() => {
    mailpitAuth = requireEnv(
      'STAGE_MAILPIT_UI_AUTH',
      'usuario:password de la UI de Mailpit del stage (el mismo valor que MAILPIT_UI_AUTH en Dokploy).',
    );
    seedPassword = requireEnv(
      'STAGE_SEED_PASSWORD',
      'la password con la que el stage sembró admin@planb.local y el resto de las personas.',
    );
  });

  test('5. Se registra, verifica el mail en Mailpit y queda con sesión', async ({ page }) => {
    copasEmail = `copas+${WALK_SUFFIX.toLowerCase()}@planb.local`;
    copasPassword = 'stage-walk-pw-1234';

    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /empezá en 30 segundos/i })).toBeVisible();
    await page.getByLabel(/tu email/i).fill(copasEmail);
    await page.getByLabel(/^contraseña$/i).fill(copasPassword);
    await page.getByLabel(/repetí la contraseña/i).fill(copasPassword);
    await fillCareerCascade(page);
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();
    await expect(page).toHaveURL(/\/sign-up\/check-inbox/, { timeout: 20_000 });

    const mail = await waitForMail(copasEmail, 20_000, {
      baseUrl: STAGE_MAILPIT_URL,
      auth: mailpitAuth,
    });
    expect(mail.Subject).toMatch(/confirmá tu cuenta en planb/i);
    const tokenMatch = mail.HTML.match(/[?&]token=([A-Za-z0-9_-]+)/);
    if (!tokenMatch) {
      throw new Error(
        `No se encontró ?token= en el mail a ${copasEmail} (subject: "${mail.Subject}")`,
      );
    }

    await page.goto(`/verify-email?token=${tokenMatch[1]}`);
    await expect(page.getByRole('heading', { name: /^¡listo!$/i })).toBeVisible();

    // La verificación no abre sesión sola: entra por sign-in, como hace el link de esa pantalla.
    await signIn(page, copasEmail, copasPassword);
    await expect(page).toHaveURL(/\/home$/, { timeout: 20_000 });

    console.log(`5: cuenta ${copasEmail} verificada`);
  });

  test('6. Reseña la Cátedra Ruiz y la ficha suma la voz', async ({ page }) => {
    await page.goto(`/chairs/${CHAIR_RUIZ}`);
    const belowFloor = page.getByText(/^Junta \d+ reseñas?: con \d+ más se publica\.$/);
    // Espera acotada y no el expect a 30 s de siempre: si esto no aparece porque la cátedra ya
    // publica, un timeout mudo no dice por qué. Ruiz siembra con 6 voces y el piso es 10
    // (CorpusSeedData.cs), así que un stage recién sembrado siempre arranca bajo el piso.
    await belowFloor.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    if ((await belowFloor.count()) === 0) {
      throw new Error(
        'La Cátedra Ruiz ya publica: el recorrido arranca sobre el stage recién sembrado (paso 8 del guion de clics de deploy.md).',
      );
    }
    const beforeText = (await belowFloor.textContent()) ?? '';
    const beforeMatch = beforeText.match(/Junta (\d+) reseñas?: con (\d+) más se publica\./);
    if (!beforeMatch) {
      throw new Error(`No se pudo leer el conteo de la ficha de Ruiz: "${beforeText}"`);
    }
    const reviewCount = Number(beforeMatch[1]);
    const missing = Number(beforeMatch[2]);

    await signIn(page, copasEmail, copasPassword);
    await expect(page).toHaveURL(/\/home$/, { timeout: 20_000 });

    await page.getByRole('link', { name: /escribir reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/new$/, { timeout: 20_000 });

    await page.getByRole('searchbox', { name: /materia/i }).fill('Fundamentos');
    await page.getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') }).click();
    await page.getByRole('button', { name: /^2024-C1$/ }).click();
    const chair = page.getByRole('button', { name: 'Ruiz', exact: true });
    await expect(chair).toBeVisible({ timeout: 15_000 });
    await chair.click();

    // Las tres capas: contexto, conducta de la cátedra y vivencia (mismo trío que usa
    // e2e/reviews/chair-facts.spec.ts para la última reseña del piso).
    await page.getByRole('button', { name: /^La aprob.$/ }).click();
    await page
      .getByRole('button', { name: /^Casi nunca$/ })
      .first()
      .click();
    await page.getByRole('button', { name: /^No$/ }).last().click();

    // El campo libre le deja una nota al paso 7: el corpus sembrado no trae texto libre propio
    // (`CorpusSeedData` no lo genera), así que sin esto la curaduría no tendría nada que leer.
    freeTextNote = `Recorrido para Copas (${WALK_SUFFIX}): no avisaban los cambios de aula.`;
    await page.getByLabel(/algo que no te preguntamos/i).fill(freeTextNote);

    await page.getByRole('button', { name: /enviar la reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine\?published=1$/, { timeout: 30_000 });
    await expect(page.getByRole('link', { name: /cátedra ruiz/i })).toBeVisible();

    await page.goto(`/chairs/${CHAIR_RUIZ}`);
    if (missing === 1) {
      // Esta reseña completa el piso: la línea de abajo del piso deja de existir
      // (chair-facts-sheet.tsx:44-45) y hay que leer el branch publicado. "Qué hizo la cátedra" es
      // una marca fija de ese branch (chair-facts-sheet.tsx:33), a diferencia de la fama o los
      // contrastes, que son condicionales.
      await expect(page.getByText('Qué hizo la cátedra')).toBeVisible({ timeout: 30_000 });
    } else {
      await expect(
        page.getByText(`Junta ${reviewCount + 1} reseñas: con ${missing - 1} más se publica.`),
      ).toBeVisible({ timeout: 30_000 });
    }

    console.log(`6: Ruiz pasó de ${reviewCount} a ${reviewCount + 1}`);
  });

  test('7. Backoffice: cátedra nueva y una frase destilada del campo libre', async ({ page }) => {
    // Cierra la sesión de Copas antes de entrar como admin, tal cual el guion de clics.
    await signIn(page, copasEmail, copasPassword);
    await expect(page).toHaveURL(/\/home$/, { timeout: 20_000 });
    await page.getByRole('button', { name: /copas/i }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/sign-in(\?|$)/, { timeout: 15_000 });

    await signIn(page, ADMIN.email, seedPassword);
    await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });

    // 7a. Cátedra nueva de Fundamentos de Control de Calidad, con su titular. La UI para sumar un
    // integrante no existe todavía (mismo límite que documenta e2e/admin/chairs.spec.ts): el
    // titular se carga por API, contra los mismos endpoints que ese spec verifica.
    const chairName = `StageWalk${WALK_SUFFIX}`;
    await page.goto(`/admin/chairs?subjectId=${SUBJECT_211}`);
    await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
    await page.getByRole('button', { name: /cargar cátedra/i }).click();
    const chairHeading = page.getByRole('heading', {
      name: new RegExp(`Cátedra ${chairName}`, 'i'),
    });
    await expect(chairHeading).toBeVisible({ timeout: 15_000 });

    const chairsResponse = await page.request.get(`/api/academic/chairs?subjectId=${SUBJECT_211}`);
    expect(chairsResponse.status()).toBe(200);
    const chairs = (await chairsResponse.json()) as { id: string; name: string }[];
    const newChair = chairs.find((c) => c.name === chairName);
    if (!newChair) throw new Error(`no apareció la cátedra ${chairName} en el listado`);

    const teacherName = `Copas${WALK_SUFFIX}`;
    const teacherResponse = await page.request.post('/api/academic/teachers', {
      data: { universityId: UNSTA_ID, firstName: teacherName, lastName: 'DeStage' },
    });
    expect(teacherResponse.status()).toBe(201);
    const teacherId = ((await teacherResponse.json()) as { id: string }).id;

    const memberResponse = await page.request.post(`/api/academic/chairs/${newChair.id}/members`, {
      data: { teacherId, role: 'Lead', sinceTermId: TERM_2024_C1 },
    });
    expect(memberResponse.status()).toBe(204);

    await page.reload();
    const chairCard = page.getByRole('listitem').filter({ has: chairHeading });
    await expect(chairCard.getByText(new RegExp(teacherName))).toBeVisible();
    await expect(chairCard.getByText(/titular/i)).toBeVisible();

    // 7b. Curaduría: lee el texto libre que dejó la reseña del paso 6 y destila una frase nueva.
    await page.goto('/admin/curation');
    await expect(page.getByText(freeTextNote)).toBeVisible({ timeout: 15_000 });

    const code = `STAGEWALK_${WALK_SUFFIX}`;
    const question = `¿Avisaban los cambios de aula? (${WALK_SUFFIX})`;
    await page.getByLabel('Código').fill(code);
    await page.getByLabel('La pregunta').fill(question);
    await page.getByLabel(/etiqueta de la opción 1/i).fill('Sí');
    await page.getByLabel(/etiqueta de la opción 2/i).fill('No');
    await page.getByRole('button', { name: 'Destilar' }).click();

    const status = page.getByRole('status');
    await expect(status).toContainText(/entró en la versión \d+/i, { timeout: 15_000 });
    const statusText = (await status.textContent()) ?? '';
    const version = statusText.match(/entró en la versión (\d+)/i)?.[1] ?? '?';

    // Aparece en /admin/items, pero el catálogo lista todo, incluidas las retiradas
    // (item-catalog.tsx:22-29): esto no prueba que haya entrado a una versión vigente.
    await page.goto('/admin/items');
    await page.getByLabel(/buscar en el catálogo/i).fill(code);
    await expect(page.getByRole('button', { name: new RegExp(`^${code}\\b`) })).toBeVisible({
      timeout: 15_000,
    });

    // Lo que sí lo prueba: Método publica la pregunta marcada como destilada (mismo locator que
    // e2e/admin/curation.spec.ts).
    await page.goto('/method');
    const marked = page.getByText(question);
    await expect(marked).toBeVisible({ timeout: 15_000 });
    await expect(marked).toContainText('destilada');

    console.log(`7: cátedra ${chairName} creada, frase ${code} destilada en la versión ${version}`);
  });
});
