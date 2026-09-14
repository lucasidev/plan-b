import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { type CreatedChair, createChair } from '../helpers/chairs';
import { ADMIN, LUCIA } from '../helpers/personas';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Mis aportes (SC-018, US-231): absorbe lo que vivía en `/home` (retirada el 2026-09-14).
 * `/home` queda como redirect: `e2e/home/home.spec.ts` se muda acá porque su único caso (US-170
 * N2) es un estado más de esta misma pantalla, no un spec aparte.
 *
 * Los fixtures van por API (`createChair` + `createStudent`, como `undo.spec.ts` y
 * `path-to-the-ficha.spec.ts`): reseñar ya tiene su propio spec (`write-review.spec.ts`), acá lo
 * que se prueba es lo que Mis aportes lee y dibuja con esos datos ya cargados.
 */

const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

async function ensureOk(response: APIResponse, step: string): Promise<void> {
  if (response.ok()) return;
  const body = await response.text().catch(() => '<no body>');
  throw new Error(`my-contributions fixture: ${step} failed with ${response.status()}: ${body}`);
}

const DEFAULT_ANSWERS = [
  { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
  { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
];

/**
 * Publica una reseña de `subjectId`/`chairId` como `student`. Fixture, no el flujo bajo prueba.
 *
 * `answers` es configurable (default `DEFAULT_ANSWERS`): en el test de las dos cátedras, la
 * cuenta bajo prueba contesta solo `COURSE_OUTCOME` y los fillers contestan también
 * `CHAIR_ANSWERS_IN_CLASS`, para poder afirmar que esa opción ("Casi nunca") no se filtra a la
 * página de alguien que no la contestó.
 */
async function publishAsync(
  request: APIRequestContext,
  student: Pick<CreatedStudent, 'email' | 'password'>,
  target: { subjectId: string; chairId: string },
  termId: string,
  answers: { itemCode: string; optionValue: number }[] = DEFAULT_ANSWERS,
): Promise<void> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

  const published = await request.post('/api/reviews/courses', {
    data: {
      subjectId: target.subjectId,
      termId,
      chairId: target.chairId,
      answers,
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);
}

/**
 * Agrega una segunda materia y cátedra a un plan que `createChair` ya armó, para tener dos
 * cátedras en la MISMA carrera sin duplicar career+plan (lo que ya hace `createChair`). Local a
 * este spec: es el único que hoy necesita una segunda cátedra en un plan descartable.
 */
async function addChairToPlan(
  request: APIRequestContext,
  planId: string,
  label: string,
): Promise<Pick<CreatedChair, 'subjectId' | 'subjectName' | 'chairId' | 'chairName'>> {
  const tag = Math.random().toString(36).slice(2, 7).toUpperCase();

  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  await ensureOk(signIn, 'admin sign-in');

  const subjectName = `Materia ${label} ${tag}`;
  const subjectResp = await request.post(`/api/academic/career-plans/${planId}/subjects`, {
    data: {
      code: `${label}${tag}`.toUpperCase(),
      name: subjectName,
      yearInPlan: 1,
      termInYear: 1,
      termKind: 'FourMonth',
      weeklyHours: 6,
      totalHours: 96,
    },
  });
  await ensureOk(subjectResp, 'create subject');
  const subjectId = ((await subjectResp.json()) as { id: string }).id;

  const chairName = `${label} ${tag}`;
  const chairResp = await request.post(`/api/academic/subjects/${subjectId}/chairs`, {
    data: { name: chairName },
  });
  await ensureOk(chairResp, 'create chair');
  const chairId = ((await chairResp.json()) as { id: string }).id;

  return { subjectId, subjectName, chairId, chairName };
}

const UNSTA_ID = '00000001-0000-4000-a000-000000000001';

/**
 * Crea una carrera sin ningún plan (perfil sin carrera vigente, la cuenta con la que se prueba
 * este caso): `RegisterUserValidator` acepta declarar solo `careerId` justamente para este caso,
 * el real de la mayoría del catálogo. Mismo admin sign-in que `addChairToPlan`, pero se corta
 * después de crear la carrera: sin plan no hay nada más que armar.
 */
async function createCareerWithoutPlan(request: APIRequestContext, label: string): Promise<string> {
  const tag = Math.random().toString(36).slice(2, 7).toUpperCase();

  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  await ensureOk(signIn, 'admin sign-in');

  const careerResp = await request.post(`/api/academic/universities/${UNSTA_ID}/careers`, {
    data: { name: `Carrera ${label} ${tag}`, slug: `carrera-${label}-${tag}`.toLowerCase() },
  });
  await ensureOk(careerResp, 'create career without plan');
  return ((await careerResp.json()) as { id: string }).id;
}

async function signIn(
  page: import('@playwright/test').Page,
  student: Pick<CreatedStudent, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(student.email);
  await page.getByLabel(/^contraseña$/i).fill(student.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 30_000 });
}

test.describe('Mis aportes (SC-018, US-231)', () => {
  test.setTimeout(300_000);

  const students: CreatedStudent[] = [];

  test.afterEach(async ({ request }) => {
    for (const student of students) {
      await deleteStudent(request, student);
    }
    students.length = 0;
  });

  /**
   * US-170 N2: nada manda a completar un dato de más antes de dejar ver lo que ya reseñaste.
   * Volver a `/home` después de haber entrado no interpone ninguna pantalla intermedia: termina
   * derecho en Mis aportes.
   */
  test('con sesión, /home termina en Mis aportes', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });

    await page.goto('/home');
    await expect(page).toHaveURL(/\/reviews\/mine$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Mis aportes', level: 1 })).toBeVisible();
  });

  /**
   * US-231 E1, E2, E3, X2; US-134 E1: dos cátedras de la misma carrera, una a un paso del piso
   * (9) y otra que ya lo cruzó (12). El bloque 1 dice cuánto junta cada una; el bloque 4 lee esa
   * misma cobertura para la carrera de la cuenta (misma cobertura que publica la ficha de la
   * carrera, US-134, no una segunda definición). E3: "Nueve" está a un paso del piso pero esta
   * cuenta ya la reseñó, así que nunca aparece en "Tu reseña la publica". X2: la cuenta bajo
   * prueba no contestó `CHAIR_ANSWERS_IN_CLASS` (solo los fillers), así que su opción ("Casi
   * nunca") no puede aparecer en su lista cerrada: si aparece, es la respuesta de otra persona
   * filtrándose; su propia respuesta (el desenlace) sí aparece, por US-162.
   */
  test('US-231 E1, E2: cada cátedra dice cuánto junta, y la cobertura de la carrera lo resume', async ({
    page,
    request,
  }) => {
    const twelve = await createChair(request, { label: 'Doce' });
    const nine = await addChairToPlan(request, twelve.planId, 'Nueve');

    const author = await createStudent(request, {
      emailPrefix: 'e2e-mis-aportes-e1e2',
      careerPlanId: twelve.planId,
    });
    students.push(author);
    // La cuenta bajo prueba solo contesta el desenlace: `CHAIR_ANSWERS_IN_CLASS` queda para los
    // fillers, así X2 tiene algo real que afirmar (ver el docstring del test).
    await publishAsync(request, author, twelve, TERMS[0], [
      { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
    ]);
    await publishAsync(request, author, nine, TERMS[1], [
      { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
    ]);

    // 11 fillers: los 11 revisan "Doce" (11 + la del author = 12), y los primeros 8 de esos
    // mismos 11 revisan también "Nueve" (8 + la del author = 9). Reusar la cuenta evita 8 altas
    // de más: cada alta cuesta un bcrypt real (~2s de CPU), que es lo que manda este spec a
    // `SERIAL_SPECS` (ver playwright.config.ts).
    for (let i = 0; i < 11; i++) {
      const filler = await createStudent(request, { emailPrefix: `e2e-mis-aportes-e1e2-f${i}` });
      students.push(filler);
      await publishAsync(request, filler, twelve, TERMS[i % TERMS.length]);
      if (i < 8) {
        await publishAsync(request, filler, nine, TERMS[i % TERMS.length]);
      }
    }

    await signIn(page, author);

    const cardTwelve = page.getByRole('article').filter({ hasText: twelve.subjectName });
    const cardNine = page.getByRole('article').filter({ hasText: nine.subjectName });
    await expect(cardTwelve.getByText(/junta 12 reseñas/i)).toBeVisible();
    await expect(cardNine.getByText(/junta 9 reseñas/i)).toBeVisible();

    // "Nueve" está a un paso del piso (9) y esta cuenta ya la reseñó: nunca puede aparecer en
    // "Tu reseña la publica" (la excluye el bloque 2), la reseñaría de nuevo y eso no suma nada.
    await expect(page.locator('section').filter({ hasText: 'Tu reseña la publica' })).toHaveCount(
      0,
    );

    // X2: con la lista cerrada (nadie clickeó Editar), ninguna respuesta ajena se filtra. Los
    // fillers son los únicos que contestaron CHAIR_ANSWERS_IN_CLASS con "Casi nunca"; si esa
    // etiqueta apareciera acá, sería la respuesta de otra persona, no la de esta cuenta.
    await expect(page.getByText('Casi nunca')).toHaveCount(0);
    // Control positivo: la propia respuesta (el desenlace que sí contestó) SÍ aparece, por
    // US-162. Si no apareciera nada, el toHaveCount(0) de arriba sería vacuo.
    await expect(cardTwelve.getByText(/cómo terminó: la aprob/i)).toBeVisible();

    // El bloque 4: la cobertura de la carrera declarada. "Doce" cruzó el piso (12 ≥ 10), "Nueve"
    // no (9 < 10): 1 de las 2 materias del plan está medida.
    await expect(page.getByText('Cuánto de tu carrera está medido')).toBeVisible();
    await expect(page.getByText('1 de 2 materias')).toBeVisible();
    await expect(page.getByRole('link', { name: /ver la ficha de/i })).toHaveAttribute(
      'href',
      `/careers/${twelve.careerId}`,
    );
  });

  /**
   * US-231 E3: Matías reseñó una sola cursada (en una cátedra propia), y otra cátedra de su
   * misma carrera, que él no reseñó, junta 9 reseñas: a un paso del piso. El bloque 2 la ofrece
   * con Reseñar al lado, y nunca lista la que él ya reseñó.
   */
  test('US-231 E3: la cátedra de su carrera a una reseña del piso aparece en "Tu reseña la publica"', async ({
    page,
    request,
  }) => {
    const bravo = await createChair(request, { label: 'Bravo' });
    const ownChair = await addChairToPlan(request, bravo.planId, 'Propia');

    const author = await createStudent(request, {
      emailPrefix: 'e2e-mis-aportes-e3',
      careerPlanId: bravo.planId,
    });
    students.push(author);
    await publishAsync(request, author, ownChair, TERMS[0]);

    for (let i = 0; i < 9; i++) {
      const filler = await createStudent(request, { emailPrefix: `e2e-mis-aportes-e3-f${i}` });
      students.push(filler);
      await publishAsync(request, filler, bravo, TERMS[i % TERMS.length]);
    }

    await signIn(page, author);

    // La suya: dice cuánto junta, sin publicar nada de lo que contestó (X2).
    const ownCard = page.getByRole('article').filter({ hasText: ownChair.subjectName });
    await expect(ownCard.getByText(/junta \d+ rese/i)).toBeVisible();

    // Bravo, que no reseñó: en "Tu reseña la publica", con el N real y Reseñar al lado. Scopeado
    // a la sección: el bloque 3 (Tu carrera) también lista la materia de Bravo, así que buscar su
    // nombre en toda la página matchea dos veces.
    const nearFloorSection = page.locator('section').filter({ hasText: 'Tu reseña la publica' });
    await expect(nearFloorSection.getByText(bravo.subjectName)).toBeVisible();
    await expect(
      nearFloorSection.getByText(/junta 9 reseñas: con la tuya se publica/i),
    ).toBeVisible();
    await expect(nearFloorSection.getByRole('link', { name: /^reseñar$/i })).toHaveAttribute(
      'href',
      '/reviews/new',
    );
  });

  /**
   * US-231 N1: sin ninguna reseña todavía, la pantalla no muestra una lista vacía ni un cero:
   * dice a partir de cuántas reseñas publica una cátedra, con una sola acción. Los bloques de la
   * carrera se muestran igual, porque leer no depende de que la cuenta reseñe.
   */
  test('US-231 N1: sin reseñas, el bloque 1 explica el piso y los bloques de la carrera se ven igual', async ({
    page,
    request,
  }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-mis-aportes-n1' });
    students.push(student);

    await signIn(page, student);

    await expect(page.getByText(/a partir de (diez|10) rese/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^reseñar una cursada$/i })).toHaveCount(1);

    // Leer no depende de reseñar: los bloques de la carrera declarada se dibujan igual.
    // `exact: true` porque "Tu carrera" (bloque 3) es substring literal de "Cuánto de tu carrera
    // está medido" (bloque 4): sin eso, matchea las dos y rompe el modo estricto.
    await expect(page.getByText('Tu carrera', { exact: true })).toBeVisible();
    await expect(page.getByText('Cuánto de tu carrera está medido')).toBeVisible();
  });

  /**
   * US-231 N2: una carrera recién cargada, sin ninguna cátedra que cruzó el piso, no se ve
   * impecable: la cobertura dice cuántas materias tiene el plan y que ninguna publica todavía.
   */
  test('US-231 N2: carrera sin cátedras que publiquen, la cobertura lo dice y no un "0 de 0" vacío', async ({
    page,
    request,
  }) => {
    const chair = await createChair(request, { label: 'SinReseñas' });
    const student = await createStudent(request, {
      emailPrefix: 'e2e-mis-aportes-n2',
      careerPlanId: chair.planId,
    });
    students.push(student);

    await signIn(page, student);

    await expect(page.getByText('Cuánto de tu carrera está medido')).toBeVisible();
    await expect(page.getByText('0 de 1 materia')).toBeVisible();
    await expect(page.getByText(/ninguna materia junta todavía/i)).toBeVisible();
  });

  /**
   * US-231 N4: el perfil de una cuenta quedó sin carrera vigente. Registrarse contra una carrera
   * sin plan relevado (el caso real de la mayoría del catálogo) deja el perfil sin ningún
   * `CareerPlan` Active del que calcular nada: los bloques 3 y 4 no se dibujan, en vez de mostrar
   * "0 de 0".
   */
  test('US-231 N4: carrera sin plan relevado, los bloques de la carrera no se dibujan', async ({
    page,
    request,
  }) => {
    const careerId = await createCareerWithoutPlan(request, 'SinPlan');
    const student = await createStudent(request, { emailPrefix: 'e2e-mis-aportes-n4', careerId });
    students.push(student);

    await signIn(page, student);

    await expect(page.getByText('Tu carrera', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Cuánto de tu carrera está medido')).toHaveCount(0);
  });
});
