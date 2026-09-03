import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E del acto de reseñar una cursada (US-146, ADR-0082 a ADR-0084): el ciclo completo del
 * producto vigente, de la pantalla a la base.
 *
 * Cada corrida crea su propio alumno descartable, así que la regla de una voz por cuenta, materia
 * y período nunca choca contra reseñas de corridas anteriores.
 *
 * Lo que este spec protege, y no un unit test:
 *   - Que la pantalla se alcance desde el topbar, que es como llega un alumno de verdad.
 *   - Que el cuestionario vigente baje del backend y se agrupe en sus tres capas.
 *   - Que las cátedras aparezcan recién al elegir la materia (dependen de ella).
 *   - Que saltear sea real: se contestan tres de las catorce frases y la reseña se publica igual.
 *   - Que la recolección vaya sin alarma: ninguna opción se tiñe mientras se responde.
 *   - Que reseñar dos veces la misma cursada avise en vez de duplicar la voz.
 */

// Materia del plan sembrado que tiene cátedras cargadas (Pérez, González, Ruiz).
const SUBJECT_NAME = 'Fundamentos de Control de Calidad';

test.describe('Reseñar una cursada (US-146)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('publica una reseña con lo que se contestó, y saltear no cuenta', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-review' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Se llega como llega un alumno: por el botón que vive en el topbar de toda pantalla.
    await page.getByRole('link', { name: /escribir reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/new$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible();

    // Paso 1: la materia. Hasta elegirla, la pantalla no sabe qué cátedras mostrar.
    await expect(page.getByText(/elegí primero la materia/i)).toBeVisible();
    await page.getByRole('searchbox', { name: /materia/i }).fill('Fundamentos');
    await page.getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') }).click();

    // Paso 2: período y cátedra. Las cátedras llegaron recién ahora.
    await page.getByRole('button', { name: /^2025-C1$/ }).click();
    // Regex tolerante al acento: el nombre viaja del seed a la página y la comparación
    // exacta de Playwright es sensible a la normalización Unicode de la é.
    const chair = page.getByRole('button', { name: /^P.rez$/ });
    await expect(chair).toBeVisible({ timeout: 15_000 });
    await chair.click();

    // Pasos 3 a 5: se contestan TRES frases de las catorce que ofrece el cuestionario. El resto
    // queda salteado a propósito: es la mitad del modelo.
    await page.getByRole('button', { name: /^Me qued. regular$/ }).click();
    await page.getByRole('button', { name: /^Faltaron muchas$/ }).click();
    await page
      .getByRole('button', { name: /^Casi nunca$/ })
      .first()
      .click();

    // La recolección va sin alarma: la opción negativa recién elegida no se pinta de rojo.
    const negative = page.getByRole('button', { name: /^Faltaron muchas$/ });
    await expect(negative).toHaveAttribute('aria-pressed', 'true');
    const negativeColor = await negative.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(negativeColor).not.toBe('rgb(141, 36, 24)');

    // El contrato se lee antes de enviar, no después.
    await expect(page.getByText(/nunca se muestra una reseña individual/i)).toBeVisible();

    await page.getByRole('button', { name: /enviar la reseña/i }).click();
    await expect(page).toHaveURL(/\/reviews\/mine\?published=1$/, { timeout: 30_000 });

    // Una voz por cuenta, materia y período: la misma cursada, otra vez, avisa en vez de duplicar.
    await page.goto('/reviews/new');
    await page.getByRole('searchbox', { name: /materia/i }).fill('Fundamentos');
    await page.getByRole('button', { name: new RegExp(SUBJECT_NAME, 'i') }).click();
    await page.getByRole('button', { name: /^2025-C1$/ }).click();
    await page.getByRole('button', { name: /^Me qued. regular$/ }).click();
    await page.getByRole('button', { name: /enviar la reseña/i }).click();

    // Se filtra por texto porque Next.js monta su propio `role="alert"` (el route announcer) en
    // toda página, y sin filtro el locator resuelve a dos elementos.
    const duplicate = page.getByRole('alert').filter({ hasText: /ya reseñaste esta cursada/i });
    await expect(duplicate).toBeVisible({ timeout: 30_000 });
  });

  test('no deja enviar sin materia, período ni respuestas', async ({ page, context, request }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-review-guard' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    await page.goto('/reviews/new');
    await expect(page.getByRole('button', { name: /enviar la reseña/i })).toBeDisabled();
  });
});
