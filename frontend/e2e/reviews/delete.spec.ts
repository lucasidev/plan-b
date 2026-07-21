import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E for US-055: delete own review.
 *
 * Cada corrida crea su propio alumno descartable (`createStudent`, ver
 * `e2e/helpers/students.ts`): publica una reseña sobre una cursada propia, abre el modal de
 * borrado desde la card en Mías, confirma, y verifica que la reseña desaparezca del listado.
 * Con un alumno nuevo por corrida el UNIQUE(student_profile_id, subject_id, term_id) de
 * enrollment_records nunca colisiona, así que alcanza con una sola oferta sembrada.
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // Cid01 (brandt, sosa)

test.describe('Reseñas · borrar (US-055)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('borrar una reseña propia la saca del listado de Mías', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-delete' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    const enrollResp = await page.request.post('/api/me/enrollment-records', {
      data: {
        subjectId: SUBJECT_ID,
        commissionId: COMMISSION_ID,
        termId: TERM_ID,
        status: 'Aprobada',
        approvalMethod: 'Final',
        grade: 7,
      },
    });
    expect(enrollResp.ok(), `failed to seed enrollment: ${enrollResp.status()}`).toBe(true);
    const enrollmentId = ((await enrollResp.json()) as { id: string }).id;

    const tag = Math.random().toString(36).slice(2, 8);
    const reviewText = `Reseña a borrar e2e ${tag}, contenido limpio con largo suficiente para publicar.`;
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

    // Go to Mías; the just-published review is there.
    await page.goto('/reviews?tab=mine');
    const list = page.getByLabel(/tus reseñas publicadas/i);
    await expect(list.getByText(reviewText)).toBeVisible({ timeout: 15_000 });

    // Open the delete modal from that review's row and confirm.
    // The review's card is the <li> containing its text; scope the Borrar button to it.
    const card = list.locator('li', { hasText: reviewText });
    await card.getByRole('button', { name: /^borrar$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/acción permanente/i)).toBeVisible();
    await dialog.getByRole('button', { name: /^borrar reseña$/i }).click();

    // Success path: the modal closes first (proves the delete resolved), then the card's
    // <li> detaches once the list refetches. We assert the specific card, not any text in
    // the list, because the modal preview also contains the review text (the <dialog> lives
    // inside the <li>) and would double-count mid-transition.
    await expect(dialog).toHaveCount(0, { timeout: 20_000 });
    await expect(card).toHaveCount(0, { timeout: 15_000 });
  });
});
