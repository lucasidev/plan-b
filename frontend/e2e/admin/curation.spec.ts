import { expect, type Page, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';
import { createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de Curaduría (ADR-0084): el campo libre, para que el equipo lo lea.
 *
 * El ADR le prometió dos salidas al campo libre, destilar ítems nuevos y escribir notas
 * editoriales, y ninguna se puede hacer sin leerlo. Hasta esta pantalla lo único que lo leía era su
 * propio autor: la curaduría existía en el papel y no en el producto.
 */

const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
const TERM_2024_C1 = '00000005-0000-4000-a000-000000000001';
const CHAIR_PEREZ = '00000008-0000-4000-a000-000000000001';

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
    const student = await createStudent(request, { emailPrefix: 'e2e-curation' });

    try {
      const published = await request.post('/api/reviews/courses', {
        data: {
          subjectId: SUBJECT_211,
          termId: TERM_2024_C1,
          chairId: CHAIR_PEREZ,
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
      await expect(page.getByText(/control de calidad/i).first()).toBeVisible();
      await expect(page.getByText(/cátedra pérez/i).first()).toBeVisible();

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
});
