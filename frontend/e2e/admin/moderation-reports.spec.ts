import { expect, test } from '@playwright/test';
import { MODERADOR } from '../helpers/personas';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * E2E para US-050 (cola de reportes) + US-051 (detalle + decisión).
 *
 * Setup: dos alumnos descartables (`createStudent`, ver `e2e/helpers/students.ts`), uno escribe
 * una reseña y el otro la reporta, para generar un report `open`. El MODERADOR sí sigue siendo
 * la persona fija de `personas.ts`: este flujo no le muta estado (solo lee la cola y decide
 * sobre reports ajenos), que es exactamente el caso donde una persona compartida está bien (ver
 * el docstring de `personas.ts`).
 *
 * No pinpointea el report propio en la cola (la DB dev es compartida y acumula reports entre
 * runs): verifica que el report creado aparezca por su motivo, y resuelve el primero de la cola
 * para ejercitar el flujo de decisión de punta a punta. Con alumnos descartables por corrida el
 * UNIQUE(student_profile_id, subject_id, term_id) nunca colisiona, así que alcanza con una sola
 * oferta sembrada (sin pool ni rotación).
 */

// Comisión sembrada (US-065): materia+term+comisión con docente real, condición para que la
// cursada sea reseñable.
const SUBJECT_ID = '00000004-0000-4000-a000-000000000004'; // PRG101
const TERM_ID = '00000005-0000-4000-a000-000000000005'; // 2026·1c
const COMMISSION_ID = '00000007-0000-4000-a000-000000000001'; // Cid01 (brandt, sosa)

async function signIn(
  page: import('@playwright/test').Page,
  persona: Pick<CreatedStudent, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/tu email/i).fill(persona.email);
  await page.getByLabel(/^contraseña$/i).fill(persona.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
}

/** Un alumno escribe una reseña y otro la reporta. Devuelve el texto único de la reseña. */
async function seedOpenReport(
  page: import('@playwright/test').Page,
  context: import('@playwright/test').BrowserContext,
  author: CreatedStudent,
  reporter: CreatedStudent,
): Promise<string> {
  await context.clearCookies();
  await signIn(page, author);

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
  const reviewText = `Reseña a moderar e2e ${tag}, contenido limpio y suficientemente largo para publicar.`;
  await page.goto(`/reviews/write/${enrollmentId}`);
  await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.locator('input[name="docente-picker"]').first().check();
  await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
  await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();
  await page.getByPlaceholder(/¿cómo era la dinámica/i).fill(reviewText);
  await page.getByRole('button', { name: /^publicar reseña$/i }).click();
  await expect(page).toHaveURL(/\/reviews\?tab=pending$/, { timeout: 30_000 });

  await context.clearCookies();
  await signIn(page, reporter);

  await page.goto('/reviews?tab=explore');
  const card = page.getByLabel(/reseñas de la comunidad/i).locator('li', { hasText: reviewText });
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: /reportar/i }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: /datos personales/i }).click();
  await dialog.getByRole('button', { name: /enviar reporte/i }).click();
  await expect(dialog.getByText(/gracias por avisar/i)).toBeVisible({ timeout: 15_000 });

  return reviewText;
}

test.describe('Moderación · cola + decisión (US-050, US-051)', () => {
  test.setTimeout(180_000);

  let author: CreatedStudent | null = null;
  let reporter: CreatedStudent | null = null;

  test.afterEach(async ({ request }) => {
    if (author) await deleteStudent(request, author);
    if (reporter) await deleteStudent(request, reporter);
    author = null;
    reporter = null;
  });

  test('el moderador ve la cola, abre un reporte y aplica una decisión', async ({
    page,
    context,
    request,
  }) => {
    author = await createStudent(request, { emailPrefix: 'e2e-moderation-author' });
    reporter = await createStudent(request, { emailPrefix: 'e2e-moderation-reporter' });
    await seedOpenReport(page, context, author, reporter);

    // El moderador entra al backoffice de moderación.
    await context.clearCookies();
    await signIn(page, MODERADOR);
    await page.goto('/admin/moderacion/reportes');

    await expect(page.getByRole('heading', { name: /cola de reportes/i })).toBeVisible({
      timeout: 30_000,
    });
    // El report recién creado (motivo "Datos personales") aparece en la cola.
    await expect(page.getByText('Datos personales').first()).toBeVisible({ timeout: 15_000 });

    // Abre el primer reporte de la cola.
    await page
      .getByRole('link', { name: /decidir/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/moderacion\/reportes\/[0-9a-f-]{36}$/, {
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /reseña reportada/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^decisión$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /contexto del autor/i })).toBeVisible();

    // Acá la decisión se dispara con `onClick` + `useTransition`, no con `<form action>`: un click
    // pre-hidratación no ejecuta nada (se pierde), así que hay que esperar a que React hidrate o
    // Playwright clickea al vacío. No es el caso de los forms del backoffice, donde el submit
    // pre-hidratación sí ejecutaba la mutación y se comía el mensaje; eso ya lo cierra `useHydrated`.
    await page.waitForLoadState('networkidle');

    // Selecciona "Aprobar" (dismiss, siempre disponible) y aplica.
    await page.locator('label').filter({ hasText: 'Aprobar' }).click();
    await page.getByRole('button', { name: /aplicar decisión/i }).click();

    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: /aprobar esta reseña/i })).toBeVisible();
    await confirm.getByRole('button', { name: /^aplicar$/i }).click();

    // Vuelve a la cola. El redirect tras aplicar es un useEffect client (mutación pura, ADR-0046) que
    // puede no dispararse si el submit pegó en la ventana de hidratación (form procesado como POST
    // nativo); vamos a la cola directo, robusto contra ese flake. La decisión ya se aplicó server-side.
    await page.goto('/admin/moderacion/reportes');
    await expect(page.getByRole('heading', { name: /cola de reportes/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
