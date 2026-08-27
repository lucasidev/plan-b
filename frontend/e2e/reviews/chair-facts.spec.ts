import { type APIRequestContext, expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E del ciclo completo (US-147, ADR-0082 y ADR-0083): reseñar hasta cruzar el piso y ver la
 * ficha publicar.
 *
 * Es el criterio de salida de R1 y prueba la tesis entera de punta a punta: el producto recolecta
 * con cuenta y publica sin ella. Por eso el tramo de lectura se hace **sin sesión**: si la ficha
 * necesitara login, la presión que el producto existe para ejercer no llegaría a nadie.
 *
 * Lo que protege, y ningún unit test puede:
 *   - Que bajo el piso de 10 la ficha exista y diga cuánto le falta, sin adelantar un solo conteo.
 *   - Que en la décima reseña, y no antes, aparezcan la moda y la distribución.
 *   - Que la última reseña, la que cruza el piso, se pueda hacer por la pantalla real.
 *   - Que lo publicado no tenga reseñas individuales ni el desenlace de nadie (US-148).
 */

const SUBJECT_ID = '00000004-0000-4000-a000-000000000012'; // 211 Fundamentos de Control de Calidad
const SUBJECT_NAME = 'Fundamentos de Control de Calidad';
const CHAIR_GONZALEZ = '00000008-0000-4000-a000-000000000002';

// Un período por reseña: la unidad es cuenta × materia × período, y cada reseña va con su cuenta.
const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

/**
 * Las nueve primeras reseñas van por API: son el fixture que lleva la cátedra al borde del piso,
 * no el flujo bajo prueba. La décima, la que hace cruzar, sí va por la pantalla real.
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
      chairId: CHAIR_GONZALEZ,
      answers: [
        // Las tres capas: contexto, conducta de la cátedra, y vivencia.
        { itemCode: 'COURSE_OUTCOME', optionValue: outcome },
        { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
        { itemCode: 'STUDENT_COULD_ASK', optionValue: 3 },
      ],
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);
}

test.describe('La ficha de cátedra publica al cruzar el piso (US-147)', () => {
  test.setTimeout(240_000);

  const students: CreatedStudent[] = [];

  test.afterEach(async ({ request }) => {
    for (const student of students) {
      await deleteStudent(request, student).catch(() => {
        // El cleanup no puede tapar la falla real del test: si una baja no sale, se sigue.
      });
    }
    students.length = 0;
  });

  test('bajo el piso cuenta lo que falta; en la décima aparecen moda y distribución', async ({
    page,
    context,
    request,
  }) => {
    // ---- 1. La cátedra arranca sin una sola voz, y se lee sin cuenta.
    await context.clearCookies();
    await page.goto(`/chairs/${CHAIR_GONZALEZ}`);
    await expect(page.getByRole('heading', { name: /cátedra gonz.lez/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/todavía nadie contó cómo es cursar acá/i)).toBeVisible();

    // ---- 2. Nueve reseñas: la cátedra queda a una del piso.
    for (let i = 0; i < 9; i++) {
      const student = await createStudent(request, { emailPrefix: `e2e-facts-${i}` });
      students.push(student);
      await publishByApi(request, student, TERMS[i % TERMS.length], i < 6 ? 1 : 3);
    }

    await context.clearCookies();
    await page.goto(`/chairs/${CHAIR_GONZALEZ}`);

    // Dice cuántas junta y cuántas faltan, y no adelanta un solo conteo: mostrarlos con nueve
    // voces dejaría deducir quién dijo qué, que es la razón del piso (ADR-0082).
    await expect(page.getByText(/junta 9 reseñas: con 1 más se publica/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/qué hizo la cátedra/i)).toHaveCount(0);
    await expect(page.getByText(/de cada 10 que la cursan/i)).toHaveCount(0);

    // ---- 3. La décima se hace por la pantalla real, que es el acto del producto.
    const last = await createStudent(request, { emailPrefix: 'e2e-facts-last' });
    students.push(last);

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(last.email);
    await page.getByLabel(/^contraseña$/i).fill(last.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    await page.goto('/reviews/new');
    await page.getByRole('searchbox', { name: /materia/i }).fill('Fundamentos');
    await page.getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') }).click();
    await page.getByRole('button', { name: /^2024-C1$/ }).click();
    const chair = page.getByRole('button', { name: /^Gonz.lez$/ });
    await expect(chair).toBeVisible({ timeout: 15_000 });
    await chair.click();

    // Las tres capas otra vez, ahora a mano.
    await page.getByRole('button', { name: /^La aprob.$/ }).click();
    await page
      .getByRole('button', { name: /^Casi nunca$/ })
      .first()
      .click();
    await page.getByRole('button', { name: /^No$/ }).last().click();
    await page.getByRole('button', { name: /enviar la reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine\?published=1$/, { timeout: 30_000 });

    // ---- 4. Con la décima, la ficha publica. Y se lee sin sesión: esa es la mitad de la tesis.
    await context.clearCookies();
    await page.goto(`/chairs/${CHAIR_GONZALEZ}`);

    await expect(page.getByText(/10 voces/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/con 1 más se publica/i)).toHaveCount(0);

    // La moda como badge, con su etiqueta literal y su porcentaje: nunca un promedio.
    await expect(
      page.getByText(/¿contestaba las preguntas que le hacían en clase\?/i),
    ).toBeVisible();
    await expect(page.getByText(/casi nunca · 100 %/i).first()).toBeVisible();

    // La distribución completa, con los ceros y las CUATRO opciones: que nadie haya elegido
    // "nadie preguntaba" es información, no una fila para omitir.
    await expect(
      page.getByText(/siempre 0 · a veces 0 · casi nunca 100 · nadie preguntaba 0 · de 10/i),
    ).toBeVisible();

    // La tasa de finalización, agregada. Seis aprobaron y cuatro no llegaron (los tres del fixture
    // que recursaron, más el último que sí aprobó: 7 de 10).
    await expect(page.getByText(/de cada 10 que la cursan, llegan 7/i)).toBeVisible();

    // Y lo que la ficha nunca muestra: ninguna reseña suelta, ningún desenlace de una persona.
    await expect(page.getByText(/@planb\.local/i)).toHaveCount(0);
    await expect(page.getByText(/la aprobé|la recursé/i)).toHaveCount(0);
  });
});
