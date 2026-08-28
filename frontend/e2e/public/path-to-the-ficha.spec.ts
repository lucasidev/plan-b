import { type APIRequestContext, expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E del camino a la ficha **sin cuenta** (criterio de salida de R2, punto 1).
 *
 * R1 dejó la ficha de cátedra viva pero inalcanzable: se llegaba tipeando un UUID. Un instrumento
 * de presión que solo encuentra quien ya sabe la URL no presiona a nadie, así que el camino entero
 * (entrada → buscar → ficha de materia → ficha de cátedra) es tan parte del producto como los
 * conteos que publica.
 *
 * Este spec no toca ni una vez el login. Si en algún tramo apareciera un muro, el recorrido
 * fallaría acá y no en producción.
 */

const SUBJECT_NAME = 'Fundamentos de Control de Calidad';
const SUBJECT_ID = '00000004-0000-4000-a000-000000000012';
const CHAIR_PEREZ_NAME = 'Pérez';

// Un período por reseña: la unidad es cuenta × materia × período.
const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];
const CHAIR_PEREZ = '00000008-0000-4000-a000-000000000001';

/**
 * Lleva a Pérez sobre el piso por API. Es fixture, no el flujo bajo prueba: lo que se prueba es
 * que el camino de lectura llegue, y sin una cátedra publicando no habría nada a lo que llegar.
 */
async function publishByApi(
  request: APIRequestContext,
  student: CreatedStudent,
  termId: string,
  outcome: number,
): Promise<void> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

  const published = await request.post('/api/reviews/cursadas', {
    data: {
      subjectId: SUBJECT_ID,
      termId,
      chairId: CHAIR_PEREZ,
      answers: [
        { itemCode: 'COURSE_OUTCOME', optionValue: outcome },
        { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
        { itemCode: 'CHAIR_CLASSES_HELD', optionValue: 3 },
      ],
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);
}

test.describe('El camino a la ficha, sin cuenta (R2)', () => {
  test.setTimeout(240_000);

  const students: CreatedStudent[] = [];

  test.afterEach(async ({ request }) => {
    for (const student of students) {
      await deleteStudent(request, student);
    }
    students.length = 0;
  });

  test('de la entrada a los conteos de una cátedra, sin sesión en ningún momento', async ({
    page,
    context,
    request,
  }) => {
    // Fixture: diez voces sobre Pérez para que su ficha publique y la de la materia tenga qué
    // comparar. Van por API porque reseñar ya tiene su propio spec.
    for (let i = 0; i < 10; i++) {
      const student = await createStudent(request, { emailPrefix: `e2e-path-${i}` });
      students.push(student);
      await publishByApi(request, student, TERMS[i % TERMS.length], i < 7 ? 1 : 3);
    }

    // Desde acá, nadie tiene sesión. Es la mitad de la tesis: se recolecta con cuenta y se publica
    // sin ella.
    await context.clearCookies();

    // 1) La entrada muestra una ficha real, no una promesa (US-221).
    await page.goto('/');
    const sample = page.locator('#sample');
    await expect(sample.getByRole('heading', { name: /así se ve una cátedra acá/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(sample.getByText(/sale sorteada entre las que ya publican/i)).toBeVisible();
    await expect(sample.getByRole('link', { name: /ver la ficha entera/i })).toBeVisible();

    // 2) Se busca la materia por su nombre. Sin tipear un UUID en ningún momento.
    await page.getByRole('combobox', { name: /buscar materia/i }).fill('Fundamentos');
    await page.getByRole('option', { name: new RegExp(SUBJECT_NAME, 'i') }).click();
    await expect(page).toHaveURL(new RegExp(`/subjects/${SUBJECT_ID}$`), { timeout: 30_000 });

    // 3) La ficha de materia muestra sus cátedras por separado, que es la pregunta que contesta:
    // si lo que pasó es de la materia o de la cátedra que te tocó.
    await expect(page.getByRole('heading', { name: new RegExp(SUBJECT_NAME, 'i') })).toBeVisible();
    // En la ficha de materia las cátedras se listan por su nombre, con sus voces al lado.
    const chairLink = page
      .getByRole('link', { name: new RegExp(`^${CHAIR_PEREZ_NAME}`, 'i') })
      .first();
    await expect(chairLink).toBeVisible();

    // 4) Se entra a la cátedra y se leen sus conteos.
    await chairLink.click();
    await expect(page).toHaveURL(new RegExp(`/chairs/${CHAIR_PEREZ}$`), { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /cátedra pérez/i })).toBeVisible();
    await expect(page.getByText(/¿Se dictaron las clases\?/)).toBeVisible();
    await expect(page.getByText(/voces/).first()).toBeVisible();

    // Nunca hubo sesión: si el camino hubiera pedido login, alguna de las páginas habría
    // redirigido a /sign-in y este assert no llegaría hasta acá.
    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === 'planb_session')).toBeFalsy();
  });

  test('ninguna pantalla pública muestra un promedio, una estrella ni un testimonio', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    // Las cuatro superficies públicas del producto. Es el chequeo que protege la poda: si alguien
    // reintroduce un puntaje en cualquiera de ellas, esto lo agarra.
    const publicPages = [
      '/',
      `/subjects/${SUBJECT_ID}`,
      `/chairs/${CHAIR_PEREZ}`,
      '/teachers/00000006-0000-4000-a000-00000000000b',
    ];

    for (const path of publicPages) {
      await page.goto(path);
      const body = await page.locator('body').innerText();

      // La estrella y el "sobre 5" son la forma en que el modelo anterior publicaba un puntaje.
      expect(body, `${path} muestra una estrella`).not.toMatch(/★/);
      expect(body, `${path} muestra un puntaje sobre 5`).not.toMatch(/\d[,.]\d\s*(\/|sobre)\s*5/);
      expect(body, `${path} muestra un rating promedio`).not.toMatch(/rating promedio/i);

      // Un testimonio es texto de una reseña individual. El producto vigente no publica ninguno:
      // el campo libre no se publica nunca (ADR-0084) y la ficha solo muestra conteos.
      expect(body, `${path} muestra un testimonio entrecomillado`).not.toMatch(/[«"“].{40,}[»"”]/);
    }
  });
});
