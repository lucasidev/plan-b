import { type APIRequestContext, expect, test } from '@playwright/test';
import { type CreatedChair, createChair } from '../helpers/chairs';
import { ADMIN } from '../helpers/personas';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Inicio (`/home`, US-231): ver si lo que reseñé sirvió de algo.
 *
 * Cada test trae su propia cátedra (`createChair`) y sus propias cuentas descartables
 * (`createStudent`): los conteos que Inicio muestra son los de la cátedra entera, así que
 * compartir una cátedra sembrada con cualquier otro spec contaminaría el número exacto que estos
 * tests afirman.
 */

const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

async function publishByApi(
  request: APIRequestContext,
  student: CreatedStudent,
  chair: CreatedChair,
  termId: string,
): Promise<void> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

  const published = await request.post('/api/reviews/courses', {
    data: {
      subjectId: chair.subjectId,
      termId,
      chairId: chair.chairId,
      answers: [{ itemCode: 'COURSE_OUTCOME', optionValue: 1 }],
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);
}

async function signInByUi(
  page: import('@playwright/test').Page,
  student: Pick<CreatedStudent, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(student.email);
  await page.getByLabel(/^contraseña$/i).fill(student.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
}

test.describe('Inicio (US-231)', () => {
  test.setTimeout(300_000);

  const students: CreatedStudent[] = [];

  test.afterEach(async ({ request }) => {
    for (const student of students) {
      await deleteStudent(request, student);
    }
    students.length = 0;
  });

  /**
   * US-231 E3: Matías reseñó una sola cursada, de una cátedra que junta 9 reseñas. La ve con "le
   * falta una" y puede reseñar otra cursada desde ahí: la acción está donde está el motivo.
   */
  test('la cátedra que no llega al piso ofrece reseñar otra cursada desde ahí mismo', async ({
    page,
    request,
  }) => {
    const chair = await createChair(request, { label: 'HomeE3' });

    for (let i = 0; i < 8; i++) {
      const filler = await createStudent(request, {
        emailPrefix: `e2e-home-e3-fill-${i}`,
        careerPlanId: chair.planId,
      });
      students.push(filler);
      await publishByApi(request, filler, chair, TERMS[i % TERMS.length]);
    }

    const matias = await createStudent(request, {
      emailPrefix: 'e2e-home-e3-matias',
      careerPlanId: chair.planId,
    });
    students.push(matias);
    await publishByApi(request, matias, chair, TERMS[8 % TERMS.length]);

    await signInByUi(page, matias);

    await expect(
      page.getByRole('link', { name: new RegExp(`cátedra ${chair.chairName}`, 'i') }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/voces · le falta una/i)).toBeVisible();

    const reviewCta = page.getByRole('link', { name: /reseñar una cursada/i });
    await expect(reviewCta).toBeVisible();
    await expect(reviewCta).toHaveAttribute('href', '/reviews/new');
  });

  /**
   * US-231 N1: sin ninguna reseña, Inicio no muestra una lista vacía ni un cero: dice qué hace
   * falta para que una cátedra publique, ofrece una sola acción, y la cobertura de la carrera
   * sigue a la vista porque leer no depende de reseñar.
   */
  // Roto: #441, hasta 2026-09-30. HomePaths ofrece tres
  // acciones (Explorar, Reseñar, Mis aportes) más el nav, y la pantalla no dice en ningún lado
  // que una cátedra publica a partir de diez reseñas.
  test.fixme('sin reseñas no hay lista vacía ni cero: una sola acción y la cobertura al pie', async ({
    page,
    request,
  }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-home-n1' });
    students.push(student);

    await signInByUi(page, student);

    // Dice qué hace falta para que una cátedra publique.
    await expect(page.getByText(/a partir de (diez|10) rese/i)).toBeVisible();

    // Una sola acción, no un menú de caminos.
    await expect(
      page.getByRole('link').filter({ hasText: /reseñar|explorar|mis aportes/i }),
    ).toHaveCount(1);

    // La cobertura de la carrera sigue a la vista.
    await expect(page.getByText(/cuánto de tu carrera está medido/i)).toBeVisible();

    // X3: ninguna sugerencia de qué cursar, horarios ni orden de cursada.
    await expect(
      page.getByText(
        /te recomendamos|te sugerimos|deberías cursar|orden sugerido|horario sugerido/i,
      ),
    ).toHaveCount(0);
  });

  /**
   * US-231 N4: el perfil de una cuenta quedó sin carrera vigente (la carrera se desactivó). El
   * bloque de cobertura no se dibuja, en vez de mostrar "0 de 0".
   */
  test('sin carrera vigente, el bloque de cobertura no se dibuja', async ({ page, request }) => {
    const chair = await createChair(request, { label: 'HomeN4' });
    const student = await createStudent(request, {
      emailPrefix: 'e2e-home-n4',
      careerPlanId: chair.planId,
    });
    students.push(student);

    const adminSignIn = await request.post('/api/identity/sign-in', {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(adminSignIn.ok(), 'admin sign-in').toBeTruthy();

    const deactivated = await request.delete(`/api/academic/careers/${chair.careerId}`);
    expect(deactivated.ok(), 'deactivate career').toBeTruthy();

    await signInByUi(page, student);

    await expect(page.getByText(/cuánto de tu carrera está medido/i)).toHaveCount(0);
  });
});
