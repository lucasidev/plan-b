import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-019: report a review.
 *
 * El reportante no puede ser el autor (el backend devuelve 403), y el feed público es anónimo,
 * así que la UI no puede pre-filtrar. Usamos dos alumnos descartables (`createStudent`, ver
 * `e2e/helpers/students.ts`): uno publica una reseña con texto único, el otro la busca en el
 * feed de Explorar y la reporta. Verifica la confirmación de éxito.
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A" (brandt, sosa)

/**
 * Loguea a un alumno por UI y espera a llegar a /home. `createStudent` le crea el
 * StudentProfile de antemano, así que tanto el autor como el reportante entran directo, sin
 * pasar por onboarding (a diferencia de cuando el reportante era MATEO, una persona compartida
 * cuyo profile no estaba garantizado en una DB limpia).
 */
async function signIn(
  page: import('@playwright/test').Page,
  student: Pick<CreatedStudent, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(student.email);
  await page.getByLabel(/^contraseña$/i).fill(student.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
}

test.describe('Reseñas · reportar (US-019)', () => {
  test.setTimeout(120_000);

  let author: CreatedStudent | null = null;
  let reporter: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (author) await deleteStudent(request, author);
    if (reporter) await deleteStudent(request, reporter);
    author = null;
    reporter = null;
  });

  test('un alumno reporta la reseña de otro y ve la confirmación', async ({
    page,
    context,
    request,
  }) => {
    await context.clearCookies();

    // 1) Un alumno (autor) publica una reseña fresca con texto único para que quede arriba
    //    del feed de Explorar.
    author = await createStudent(request, { emailPrefix: 'e2e-report-author' });
    await signIn(page, author);

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

    const tag = Math.random().toString(36).slice(2, 8);
    const reviewText = `Reseña a reportar e2e ${tag}, contenido limpio y suficientemente largo para publicar.`;
    await page.goto(`/reviews/write/${enrollmentId}`);
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });
    // Elegir el docente real de la comisión (US-065). Si hay uno solo viene preseleccionado;
    // check() es idempotente, así que sirve igual.
    await page.locator('input[name="docente-picker"]').first().check();
    await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
    await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
    await page.getByPlaceholder(/¿cómo era la dinámica/i).fill(reviewText);
    await page.getByRole('button', { name: /^publicar reseña$/i }).click();
    await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });

    // 2) Cambia a otro alumno (reportante).
    await context.clearCookies();
    reporter = await createStudent(request, { emailPrefix: 'e2e-report-reporter' });
    await signIn(page, reporter);

    // 3) Busca la reseña del autor en el feed de Explorar y la reporta.
    await page.goto('/reviews?tab=explore');
    const list = page.getByLabel(/reseñas de la comunidad/i);
    const card = list.locator('li', { hasText: reviewText });
    await expect(card).toBeVisible({ timeout: 15_000 });

    await card.getByRole('button', { name: /reportar/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: /datos personales/i }).click();
    await dialog.getByRole('button', { name: /enviar reporte/i }).click();

    // 4) Success confirmation.
    await expect(dialog.getByText(/gracias por avisar/i)).toBeVisible({ timeout: 15_000 });
  });
});
