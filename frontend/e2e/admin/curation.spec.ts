import { expect, type Page, test } from '@playwright/test';
import { createChair } from '../helpers/chairs';
import { ADMIN } from '../helpers/personas';
import { createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Curaduría (ADR-0084): el campo libre, para que el equipo lo lea.
 *
 * El ADR le prometió dos salidas al campo libre, destilar frases nuevas y escribir notas
 * editoriales, y ninguna se puede hacer sin leerlo. Hasta esta pantalla lo único que lo leía era su
 * propio autor: la curaduría existía en el papel y no en el producto.
 */

const TERM_2024_C1 = '00000005-0000-4000-a000-000000000001';
const UNSTA = '00000001-0000-4000-a000-000000000001';
const TUDCS_CAREER = '00000002-0000-4000-a000-000000000003';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(email);
  await page.getByLabel(/^contraseña$/i).fill(password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

test.describe('Curaduría del campo libre (ADR-0084)', () => {
  test.setTimeout(120_000);

  test('el equipo lee lo que alguien escribió, con la cursada de la que salió', async ({
    page,
    context,
    request,
  }) => {
    const written = `Nunca supimos con qué se rendía ${Math.random().toString(36).slice(2, 8)}`;
    // Cátedra propia de esta corrida: la reseña con texto libre nunca se borra (es lo que este
    // test verifica), así que publicarla contra una sembrada le dejaría una voz de más a otro spec.
    const chair = await createChair(request, { label: 'Curation' });
    const student = await createStudent(request, { emailPrefix: 'e2e-curation' });

    try {
      const published = await request.post('/api/reviews/courses', {
        data: {
          subjectId: chair.subjectId,
          termId: TERM_2024_C1,
          chairId: chair.chairId,
          answers: [{ itemCode: 'COURSE_OUTCOME', optionValue: 1 }],
          freeText: written,
        },
      });
      expect(published.status()).toBe(201);

      await context.clearCookies();
      await signIn(page, ADMIN.email, ADMIN.password);
      await page.goto('/admin/curation');

      // El texto, con el contexto que lo hace legible.
      await expect(page.getByText(written)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(chair.subjectName).first()).toBeVisible();
      await expect(
        page.getByText(new RegExp(`cátedra ${chair.chairName}`, 'i')).first(),
      ).toBeVisible();

      // Y la pantalla dice las dos cosas que gobiernan lo que hay adentro: que no se publica, y
      // que quién lo escribió no llega hasta acá.
      await expect(page.getByText(/no se publica en ninguna ficha/i)).toBeVisible();
      await expect(page.getByText(/quién escribió cada uno no llega hasta acá/i)).toBeVisible();

      // La cuenta no está en ningún lado de la página, ni escondida en un atributo.
      const html = await page.content();
      expect(html).not.toContain(student.userId);
      expect(html).not.toContain(student.email);
    } finally {
      await deleteStudent(request, student);
    }
  });

  test('un alumno no llega a la curaduría', async ({ page, context, request }) => {
    const student = await createStudent(request, { emailPrefix: 'e2e-curation-guard' });

    try {
      await context.clearCookies();
      await signIn(page, student.email, student.password);
      await page.goto('/admin/curation');

      // El guard de (staff) lo saca: el campo libre es lo único del producto que el equipo lee y
      // nadie más, así que una pantalla abierta sería la peor forma de romper esa promesa.
      await expect(page).not.toHaveURL(/\/admin\/curation/);
    } finally {
      await deleteStudent(request, student);
    }
  });

  /**
   * El ciclo entero de destilar: la pregunta se escribe acá, entra al cuestionario como versión
   * nueva, y aparece en los dos lugares donde el instrumento se ve. En Método va marcada, que es
   * lo que deja auditar de dónde salió.
   */
  test('destilar una pregunta la mete en el cuestionario y Método la marca', async ({
    page,
    context,
  }) => {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const code = `DISTIL_${suffix}`;
    const question = `¿Sabías con qué se rendía ${suffix}?`;

    await context.clearCookies();
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin/curation');

    await page.getByLabel('Código').fill(code);
    await page.getByLabel('La pregunta').fill(question);
    await page.getByLabel(/etiqueta de la opción 1/i).fill('Sí');
    await page.getByLabel(/etiqueta de la opción 2/i).fill('No');
    await page.getByRole('button', { name: 'Destilar' }).click();

    // Dice en qué versión del cuestionario entró: ese número es el corte de la serie.
    await expect(page.getByRole('status')).toContainText(/entró en la versión \d+/i, {
      timeout: 15_000,
    });

    // Y Método la publica, marcada como destilada.
    await context.clearCookies();
    await page.goto('/method');
    const marked = page.getByText(question);
    await expect(marked).toBeVisible({ timeout: 15_000 });
    await expect(marked).toContainText('destilada');
  });

  /**
   * La segunda salida del campo libre (ADR-0084): el equipo lee y publica una síntesis. Se escribe
   * en la curaduría y se lee en la ficha de la carrera, sin cuenta. La síntesis se publica; el
   * texto del que salió, no.
   */
  test('una nota del equipo se escribe acá y se lee en la ficha de la carrera', async ({
    page,
    context,
  }) => {
    const note = `Varias cursadas mencionan que no se sabe con qué se rinde ${Math.random()
      .toString(36)
      .slice(2, 8)}.`;

    await context.clearCookies();
    await signIn(page, ADMIN.email, ADMIN.password);

    // La universidad va por la URL: elegirla es ir a buscar sus carreras.
    await page.goto(`/admin/curation?universityId=${UNSTA}`);
    await page.getByLabel('Carrera').selectOption(TUDCS_CAREER);
    await page.getByLabel('La nota').fill(note);
    await page.getByRole('button', { name: /publicar nota/i }).click();

    await expect(page.getByRole('status')).toContainText(/ya se lee en la ficha/i, {
      timeout: 15_000,
    });

    // Y cualquiera la lee, con su procedencia y su fecha.
    await context.clearCookies();
    await page.goto(`/careers/${TUDCS_CAREER}`);
    await expect(page.getByText(note)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/leída de comentarios que no se publican/i)).toBeVisible();
  });
});
