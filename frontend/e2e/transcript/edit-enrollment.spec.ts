import { expect, test } from '@playwright/test';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E de US-015: corregir una cursada ya cargada.
 *
 * Lo que este spec protegía antes era el camino destructivo: volver la cursada a "cursando" pedía
 * confirmación porque mandaba a revisión la reseña anclada a ella. **Ese mecanismo se podó con el
 * modelo anterior** (ADR-0063): la reseña vigente se ancla a cuenta, materia y período, no a la
 * cursada, así que editar el historial no la toca.
 *
 * Por eso ahora prueba lo contrario, y sigue valiendo la pena: que editar sea corregir (el form
 * llega precargado) y que **no** aparezca ninguna advertencia sobre reseñas. Una advertencia que
 * describe una consecuencia inexistente es peor que ninguna: le enseña al alumno a desconfiar de
 * los avisos del producto.
 *
 * Alumno descartable por corrida: `enrollment_records` tiene UNIQUE(student_profile_id,
 * subject_id, term_id), así que uno nuevo deja libre la única oferta sembrada.
 */

// Comisión sembrada (US-065): la terna con docente real.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000005'; // 111 Desarrollo de Software
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026-C1
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // comisión "A"

test.describe('Historial · editar una cursada (US-015)', () => {
  test.setTimeout(120_000);

  let student: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (!student) return;
    await deleteStudent(request, student);
    student = null;
  });

  test('el form llega precargado y guardar no advierte sobre reseñas', async ({
    page,
    context,
    request,
  }) => {
    student = await createStudent(request, { emailPrefix: 'e2e-edit-enrollment' });

    await context.clearCookies();
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(student.email);
    await page.getByLabel(/^contraseña$/i).fill(student.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // La cursada aprobada se siembra por API: es el punto de partida, no el flujo bajo prueba.
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

    // ── El flujo bajo prueba arranca acá ──────────────────────────────────────────────────
    await page.goto('/my-career?tab=transcript');
    await page
      .getByRole('link', { name: /^editar /i })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`/my-career/transcript/${enrollmentId}/edit$`));
    // Precargado con lo que estaba guardado: eso es lo que hace que editar sea corregir y no
    // volver a cargar todo.
    await expect(page.getByLabel(/^Estado$/)).toHaveValue('Passed', { timeout: 30_000 });
    await expect(page.getByLabel(/Nota final/i)).toHaveValue('7');

    await page.getByLabel(/^Estado$/).selectOption('InProgress');
    await page.getByRole('button', { name: /guardar cambios/i }).click();

    // Guarda derecho: sin diálogo y sin aviso sobre reseñas, porque no hay ninguna consecuencia
    // sobre lo que el alumno contó de esa cursada.
    await expect(page).toHaveURL(/\/my-career\?tab=transcript/, { timeout: 30_000 });
    await expect(page.getByText('cursando', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Scopeado al main: "Escribir reseña" vive en el topbar de toda pantalla del alumno, y no es
    // una advertencia sino la puerta a contar una cursada.
    await expect(page.getByRole('main').getByText(/reseña/i)).toHaveCount(0);
  });
});
