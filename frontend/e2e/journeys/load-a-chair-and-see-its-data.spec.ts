import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * Los dos recorridos que prueban que el producto ya no depende del seed (#376).
 *
 * <p>
 * Los specs de cada pieza verifican su pieza: que el alta de cátedra funcione, que el par se
 * calcule, que Método se lea. Acá se prueba lo que ninguno mira, que es el ciclo completo: algo
 * que se carga en el backoffice llega hasta la persona que lo va a usar, y un dato agregado se
 * puede auditar desde donde se lo lee.
 * </p>
 *
 * <p>
 * Más el chequeo que protege la poda del seguimiento de carrera: si alguien reintroduce un paso
 * de "cargá tu historial", esto lo agarra.
 * </p>
 */

const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
const SUBJECT_121 = '00000004-0000-4000-a000-000000000005';
const TERM_2024_C1 = '00000005-0000-4000-a000-000000000001';

const randomSuffix = () => Math.random().toString(36).slice(2, 7).toUpperCase();

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

test.describe('Cargar una cátedra y verla llegar hasta el alumno (#376)', () => {
  test.setTimeout(120_000);

  /**
   * El ciclo que prueba que el catálogo ya no es de solo lectura: se carga una cátedra por la
   * pantalla real del backoffice, y esa cátedra aparece donde el alumno la necesita, que es al
   * reseñar, y donde cualquiera la lee, que es la ficha pública de su materia.
   */
  test('lo que se carga en el backoffice llega a Reseñar y a la ficha pública', async ({
    page,
    context,
    request,
  }) => {
    const chairName = `Ciclo${randomSuffix()}`;
    const student = await createStudent(request, { emailPrefix: 'e2e-cycle' });

    try {
      // 1. El alta, por la pantalla real del backoffice.
      await context.clearCookies();
      await signIn(page, ADMIN.email, ADMIN.password);
      await page.goto(`/admin/chairs?subjectId=${SUBJECT_211}`);
      await page.getByLabel(/nombre de la cátedra/i).fill(chairName);
      await page.getByRole('button', { name: /cargar cátedra/i }).click();
      await expect(
        page.getByRole('heading', { name: new RegExp(`Cátedra ${chairName}`, 'i') }),
      ).toBeVisible({ timeout: 15_000 });

      // 2. Un alumno la encuentra al reseñar. Cuenta nueva: nunca la vio antes.
      await context.clearCookies();
      await signIn(page, student.email, student.password);
      await page.goto('/reviews/new');

      // La lista arranca por las de primer año, así que la materia se busca, que es lo que haría
      // el alumno. El picker de cátedra depende de ella: hasta elegirla no hay nada que ofrecer.
      await page.getByLabel(/buscá la materia que cursaste/i).fill('Control de Calidad');
      await page.getByRole('button', { name: /fundamentos de control de calidad/i }).click();
      await expect(page.getByRole('button', { name: chairName, exact: true })).toBeVisible({
        timeout: 15_000,
      });

      // 3. Y cualquiera la lee en la ficha pública de la materia, sin cuenta.
      await context.clearCookies();
      await page.goto(`/subjects/${SUBJECT_211}`);
      await expect(page.getByText('Sus cátedras')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('link', { name: new RegExp(chairName, 'i') })).toBeVisible();
    } finally {
      await deleteStudent(request, student);
    }
  });
});

test.describe('El dato nuevo se lee y se audita sin cuenta (#376)', () => {
  // Diez cuentas con dos reseñas cada una: es el fixture que lleva el par al piso, y cada una
  // pasa por registro, verificación por mail y perfil.
  test.setTimeout(300_000);

  const students: CreatedStudent[] = [];

  test.afterEach(async ({ request }) => {
    for (const student of students.splice(0)) {
      await deleteStudent(request, student);
    }
  });

  async function reviewBothSubjects(request: APIRequestContext, student: CreatedStudent) {
    const signIn = await request.post('/api/identity/sign-in', {
      data: { email: student.email, password: student.password },
    });
    expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

    for (const subjectId of [SUBJECT_211, SUBJECT_121]) {
      const published = await request.post('/api/reviews/courses', {
        data: {
          subjectId,
          termId: TERM_2024_C1,
          chairId: null,
          answers: [{ itemCode: 'COURSE_OUTCOME', optionValue: 1 }],
          freeText: null,
        },
      });
      expect(published.status(), `publicar ${subjectId} para ${student.email}`).toBe(201);
    }
  }

  /**
   * La co-cursada es el dato que la lapicera no puede calcular, y el único que este sprint suma a
   * la ficha. Se lee sin cuenta, y desde ahí se llega a Método, que explica cómo se calculó: un
   * número sin método publicado no aguanta una discusión.
   */
  test('se lee la co-cursada en la ficha de una materia y se llega a Método', async ({
    page,
    request,
  }) => {
    // El piso del par es de 10, así que diez cuentas llevan las dos materias en el mismo período.
    for (let i = 0; i < 10; i++) {
      const student = await createStudent(request, { emailPrefix: `e2e-pair-${i}` });
      students.push(student);
      await reviewBothSubjects(request, student);
    }

    await page.goto(`/subjects/${SUBJECT_211}`);

    // Sin sesión: en ningún momento aparece un pedido de cuenta para leer.
    await expect(page.getByText('Con qué se llevó')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/la llevaron junto con esta/i).first()).toBeVisible();

    // Y desde el número se llega a la regla que lo calculó.
    await page.getByRole('link', { name: /cómo calculamos esto/i }).click();
    await expect(page).toHaveURL(/\/method$/);
    await expect(
      page.getByRole('heading', { name: /cómo se calcula lo que publicamos/i }),
    ).toBeVisible();

    // Todo el recorrido fue anónimo: si alguna pantalla hubiera exigido cuenta, habría rebotado.
    expect(page.url()).not.toMatch(/sign-in/);
  });
});

test.describe('Ninguna pantalla pide la trayectoria de nadie (#371, #376)', () => {
  test.setTimeout(120_000);

  /**
   * El producto informa sobre materias y cátedras; no hace seguimiento de la carrera de nadie
   * (ADR-0086). La poda del historial académico ya se hizo, y esto es lo que impide que vuelva:
   * si alguien reintroduce un "cargá tu historial" o una pantalla que pida marcar las materias
   * aprobadas, alguna de estas rutas lo va a mostrar.
   */
  test('ni al entrar, ni al reseñar, ni en el perfil', async ({ page, context, request }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-no-track' });
    try {
      await context.clearCookies();
      await signIn(page, student.email, student.password);

      for (const route of ['/home', '/reviews/new', '/me', `/subjects/${SUBJECT_211}`]) {
        await page.goto(route);
        const text = (await page.locator('body').textContent()) ?? '';

        expect(text, `${route} pide cargar un historial`).not.toMatch(
          /cargá tu historial|carga tu historial|tu historial académico/i,
        );
        expect(text, `${route} pide marcar materias`).not.toMatch(
          /materias que (aprobaste|cursaste)|marcá las materias|tu avance en la carrera/i,
        );
        expect(text, `${route} promete una trayectoria`).not.toMatch(
          /tu trayectoria|seguimiento de tu carrera/i,
        );
      }
    } finally {
      await deleteStudent(request, student);
    }
  });
});
