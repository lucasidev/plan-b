import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-048: tab Explorar shows the public feed of Published reviews.
 *
 * El endpoint es público (AllowAnonymous), pero el shell de `/reviews` vive en `(member)`, así
 * que la página requiere sesión. Creamos un alumno descartable (`createStudent`, ver
 * `e2e/helpers/students.ts`) solo para entrar al shell autenticado.
 *
 * Semilla condicional: si el feed público ya tiene alguna reseña Published (lo normal después
 * de que corrieron otros specs de reseñas, o en una DB con datos previos) no publicamos nada
 * nuevo; si está vacío (DB recién reseteada) el alumno publica una para que el feed tenga algo
 * que mostrar. A diferencia de `mine.spec.ts` / `pending.spec.ts`, acá el chequeo es sobre el
 * feed público completo, no sobre "mis reseñas": no depende de quién la haya publicado.
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A" (brandt, sosa)

test.describe('Reseñas · tab Explorar (US-048)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('lista las reseñas públicas y permite filtrar por dificultad', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-explore' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Make sure there's at least one Published review the feed can show. We use the
    // public endpoint directly (no auth needed) to check.
    const existing = await page.request.get('/api/reviews?pageSize=1');
    expect(existing.ok(), `failed to fetch public feed: ${existing.status()}`).toBe(true);
    const existingBody = (await existing.json()) as { items: unknown[] };

    if (existingBody.items.length === 0) {
      const enrollResp = await page.request.post('/api/me/enrollment-records', {
        data: {
          subjectId: SUBJECT_ID,
          commissionId: COMMISSION_ID,
          termId: TERM_ID,
          status: 'Passed',
          approvalMethod: 'FinalExam',
          grade: 7,
        },
      });
      expect(enrollResp.ok(), `failed to seed enrollment: ${enrollResp.status()}`).toBe(true);
      const enrollmentId = ((await enrollResp.json()) as { id: string }).id;

      await page.goto(`/reviews/write/${enrollmentId}`);
      await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
        timeout: 30_000,
      });
      // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
      // check() es idempotente, así que sirve igual.
      await page.locator('input[name="docente-picker"]').first().check();
      await page.locator('label:has(input[name="field-rating-radio"][value="5"])').click();
      await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
      await page
        .getByPlaceholder(/¿cómo era la dinámica/i)
        .fill('E2E seed para tab Explorar: contenido honesto y razonable para el público.');
      await page.getByRole('button', { name: /^publicar reseña$/i }).click();
      await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });
    }

    await page.goto('/reviews?tab=explore');
    await expect(page.getByRole('heading', { name: /comunidad y aporte/i })).toBeVisible({
      timeout: 15_000,
    });

    // Filter sidebar rendered with the "Todas" entry active by default.
    const allLink = page.getByRole('link', { name: /^todas$/i });
    await expect(allLink).toHaveAttribute('aria-pressed', 'true');

    // Feed has at least one card.
    const list = page.getByLabel(/reseñas de la comunidad/i);
    await expect(list).toBeVisible();
    await expect(list.locator('article').first()).toBeVisible();

    // Clicking a difficulty filter changes the URL + marks the link as active.
    await page.getByRole('link', { name: /3 · justa/i }).click();
    await expect(page).toHaveURL(/[?&]difficulty=3/);
    const activeFilter = page.getByRole('link', { name: /3 · justa/i });
    await expect(activeFilter).toHaveAttribute('aria-pressed', 'true');
  });
});
