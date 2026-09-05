import { type APIRequestContext, expect, test } from '@playwright/test';
import { type CreatedChair, createChair } from '../helpers/chairs';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de deshacer lo aportado (criterio de salida de R2, punto 3): corregir y borrar una reseña, y
 * ver que los conteos de la ficha se mueven en consecuencia.
 *
 * Lo que protege, y ningún unit test puede: que el ciclo de vida del dato **cierre**. Un producto
 * que recolecta y no deja sacar lo aportado le pide a alguien que confíe sin salida; el mecanismo
 * de salida solo sirve si de verdad mueve lo publicado, y eso cruza cuatro pantallas y dos módulos.
 *
 * El caso más filoso está al final: la reseña que se borra es la que hizo cruzar el piso, así que
 * borrarla hace que la ficha **deje de publicar**. Es el peor escenario del deshacer y el que más
 * fácil se rompe.
 *
 * La cátedra es propia de esta corrida (`createChair`), no una de las tres sembradas: la
 * progresión exacta de conteos que este spec afirma exige arrancar en cero, y una cátedra sembrada
 * no lo garantiza si otro spec ya publicó ahí.
 */

const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

/**
 * Las nueve que dejan a la cátedra al borde del piso. Fixture, no el flujo bajo prueba.
 *
 * Devuelve el id de la reseña porque el cleanup tiene que borrarla: dar de baja la cuenta **no**
 * borra lo que aportó (esa es la posición del producto, se saca antes de a uno), así que sin esto
 * cada corrida le dejaría nueve voces más a la cátedra y el reintento arrancaría sobre el piso.
 */
async function publishByApi(
  request: APIRequestContext,
  student: CreatedStudent,
  chair: CreatedChair,
  termId: string,
): Promise<string> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

  const published = await request.post('/api/reviews/courses', {
    data: {
      subjectId: chair.subjectId,
      termId,
      chairId: chair.chairId,
      // Las nueve aprueban: así el desenlace de la décima se ve solo en el conteo.
      answers: [
        { itemCode: 'COURSE_OUTCOME', optionValue: 1 },
        { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
      ],
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);

  const body = (await published.json()) as { id: string };
  return body.id;
}

/** Saca del corpus lo que sembró el fixture, para que la corrida siguiente empiece de cero. */
async function unpublishByApi(
  request: APIRequestContext,
  student: CreatedStudent,
  reviewId: string,
): Promise<void> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  if (!signIn.ok()) return;

  await request.delete(`/api/reviews/courses/${reviewId}`);
}

test.describe('Deshacer lo aportado (US-165, US-166)', () => {
  test.setTimeout(300_000);

  const students: CreatedStudent[] = [];
  const seeded: { student: CreatedStudent; reviewId: string }[] = [];

  test.afterEach(async ({ request }) => {
    for (const { student, reviewId } of seeded) {
      await unpublishByApi(request, student, reviewId);
    }
    seeded.length = 0;

    for (const student of students) {
      await deleteStudent(request, student);
    }
    students.length = 0;
  });

  test('corregir mueve los conteos y borrar los devuelve bajo el piso', async ({
    page,
    context,
    request,
  }) => {
    const chair = await createChair(request, { label: 'Undo' });

    for (let i = 0; i < 9; i++) {
      const student = await createStudent(request, { emailPrefix: `e2e-undo-${i}` });
      students.push(student);
      const reviewId = await publishByApi(request, student, chair, TERMS[i % TERMS.length]);
      seeded.push({ student, reviewId });
    }

    // Este alumno se registra en el plan descartable de la corrida: el picker de /reviews/new
    // solo ofrece las materias del plan declarado, y la materia descartable no está en ningún otro.
    const author = await createStudent(request, {
      emailPrefix: 'e2e-undo-author',
      careerPlanId: chair.planId,
    });
    students.push(author);

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(author.email);
    await page.getByLabel(/^contraseña$/i).fill(author.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // ── 1. La décima, por la pantalla real, con un desenlace que no llega ──────────────────
    await page.goto('/reviews/new');
    await page.getByRole('searchbox', { name: /materia/i }).fill(chair.subjectName);
    await page.getByRole('button', { name: new RegExp(chair.subjectName, 'i') }).click();
    await page.getByRole('button', { name: /^2025-C1$/ }).click();
    await page.getByRole('button', { name: chair.chairName, exact: true }).click();
    await page.getByRole('button', { name: /^La recurs/ }).click();
    await page.getByRole('button', { name: /enviar la reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine\?published=1$/, { timeout: 30_000 });

    // Aterriza en Mis aportes, con lo suyo a la vista y sus dos salidas.
    await expect(page.getByRole('heading', { name: chair.subjectName })).toBeVisible();
    await expect(page.getByRole('button', { name: /^corregir$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^borrar$/i })).toBeVisible();

    // La décima hizo cruzar el piso: la ficha publica, y con 9 de 10 llegando (la del autor no).
    await page.goto(`/chairs/${chair.chairId}`);
    await expect(page.getByText(/de cada 10 que la cursan, llegan 9/i)).toBeVisible({
      timeout: 30_000,
    });

    // ── 2. Corregir el desenlace, y el conteo se mueve ────────────────────────────────────
    await page.goto('/reviews/mine');
    await page.getByRole('button', { name: /^corregir$/i }).click();
    await expect(page.getByText(/está cargado lo que contestaste/i)).toBeVisible();

    // Lo contestado viene precargado: por eso corregir una sola respuesta no obliga a rehacer las
    // catorce. Se cambia el desenlace y nada más.
    await page.getByRole('button', { name: /^La aprob/ }).click();
    await page.getByRole('button', { name: /guardar la corrección/i }).click();
    await expect(page.getByRole('button', { name: /^corregir$/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`/chairs/${chair.chairId}`);
    await expect(page.getByText(/de cada 10 que la cursan, llegan 10/i)).toBeVisible({
      timeout: 30_000,
    });

    // ── 3. Borrarla la saca de los conteos, y la ficha deja de publicar ───────────────────
    await page.goto('/reviews/mine');
    await page.getByRole('button', { name: /^borrar$/i }).click();
    await expect(page.getByText(/sus respuestas dejan de contar/i)).toBeVisible();
    await page.getByRole('button', { name: /sí, borrarla/i }).click();
    await expect(page.getByText(/todavía no reseñaste ninguna cursada/i)).toBeVisible({
      timeout: 30_000,
    });

    // Nueve voces otra vez: bajo el piso, la ficha vuelve a decir cuánto le falta y no publica un
    // solo conteo. Es lo que hace del borrar una salida real y no un gesto.
    await page.goto(`/chairs/${chair.chairId}`);
    await expect(page.getByText(/Junta 9 reseñas: con 1 más se publica/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/de cada 10 que la cursan/i)).toHaveCount(0);
  });

  /**
   * US-165 N4: no existe un borrado en bloque. Diego tiene reseñas de dos cursadas distintas y
   * cada una se borra de a una, con su propio botón al lado; borrar una no toca a la otra.
   */
  test('cada reseña se borra de a una, con su propio botón Borrar al lado', async ({
    page,
    context,
    request,
  }) => {
    const chairA = await createChair(request, { label: 'BulkA' });
    const chairB = await createChair(request, { label: 'BulkB' });

    const author = await createStudent(request, {
      emailPrefix: 'e2e-bulk-author',
      careerPlanId: chairA.planId,
    });
    students.push(author);

    const reviewIdA = await publishByApi(request, author, chairA, TERMS[0]);
    seeded.push({ student: author, reviewId: reviewIdA });
    const reviewIdB = await publishByApi(request, author, chairB, TERMS[1]);
    seeded.push({ student: author, reviewId: reviewIdB });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(author.email);
    await page.getByLabel(/^contraseña$/i).fill(author.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    await page.goto('/reviews/mine');
    await expect(page.getByRole('heading', { name: chairA.subjectName })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: chairB.subjectName })).toBeVisible();

    // Dos reseñas, dos botones Borrar: nunca uno solo para las dos juntas.
    await expect(page.getByRole('button', { name: /^borrar$/i })).toHaveCount(2);

    const cardA = page.getByRole('article').filter({ hasText: chairA.subjectName });
    const cardB = page.getByRole('article').filter({ hasText: chairB.subjectName });

    await cardA.getByRole('button', { name: /^borrar$/i }).click();
    await expect(cardA.getByText(/sus respuestas dejan de contar/i)).toBeVisible();
    await cardA.getByRole('button', { name: /sí, borrarla/i }).click();

    // Solo esa se fue: la otra sigue con su propia tarjeta y su propio botón, intacta.
    await expect(page.getByRole('heading', { name: chairA.subjectName })).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(cardB.getByRole('heading', { name: chairB.subjectName })).toBeVisible();
    await expect(page.getByRole('button', { name: /^borrar$/i })).toHaveCount(1);
  });
});
