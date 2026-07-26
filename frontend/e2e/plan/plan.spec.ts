import { expect, type Page, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * Plan E2E (US-046 shell + US-016 simulador + US-096 comisiones/choques + US-023 borradores +
 * US-024/US-027 comunidad). Todo el planificador corre contra el backend real: no queda nada mock.
 *
 * Cubre el recorrido que le da sentido a la herramienta:
 *  - Sumar una materia del catálogo real y elegir su comisión de la oferta del período.
 *  - Guardar esa combinación como borrador, verla en "Borradores", compartirla y publicarla.
 *  - La pestaña "Comunidad" con las simulaciones compartidas del plan.
 *
 * Regla de robustez: NO afirmamos materias ni comisiones puntuales. La suite comparte la persona
 * Lucía y el catálogo disponible cambia según qué otros specs consumieron cursadas (una materia ya
 * aprobada deja de ofrecerse), así que afirmamos comportamiento, no data concreta. Por el mismo
 * motivo el estado inicial puede tener o no borradores de corridas anteriores: `openBuilder`
 * absorbe las dos ramas.
 */

test.describe('Planificar', () => {
  // Dev frontend (turbopack JIT) compila la primera vez ~10s, y el sign-in en dev tarda ~4s.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Sidebar link es "Planificar ⌘3" (incluye shortcut); usamos substring match.
    await page.getByRole('link', { name: /plan/i }).first().click();
    await expect(page).toHaveURL(/\/plan/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /tu período, ajustable/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('el selector de período y las tres pestañas renderean', async ({ page }) => {
    await expect(page.getByLabel(/período lectivo/i)).toBeVisible();
    // El label del período usa el formato canónico ("2026 · 1er cuatrimestre"), nunca la forma
    // codificada que ADR-0051 prohíbe.
    await expect(page.getByLabel(/período lectivo/i)).not.toHaveValue(/^\d{4}[·-]\dc$/);

    await openBuilder(page);
    await expect(page.getByRole('link', { name: /en curso/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /borradores/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^comunidad$/i })).toBeVisible();
  });

  test('sumar materia, elegir comisión y ver el calendario real', async ({ page }) => {
    await openBuilder(page);
    // El período por defecto es el que viene, y el seed carga la oferta de comisiones en el primer
    // cuatrimestre de 2026: elegimos ese para que haya comisiones que elegir. Por label (formato
    // canónico de `@/lib/academic-terms`), no por id.
    await selectTermWithOffering(page);
    await addFirstAvailableSubject(page);

    // Sin comisión elegida, la métrica de choques no inventa un cero: dice que falta elegirla.
    await expect(page.getByText(/sin comisión elegida/i).first()).toBeVisible({ timeout: 20_000 });

    const commissionPicked = await pickFirstCommission(page);
    if (!commissionPicked) {
      // La materia que tocó no tiene oferta cargada en este período: es un estado válido y la UI lo
      // dice explícito. No forzamos el caso: lo afirmamos y salimos.
      await expect(page.getByText(/sin oferta cargada/i).first()).toBeVisible();
      return;
    }

    // Con comisión elegida el calendario se arma con las franjas reales de esa comisión.
    await expect(page.getByRole('heading', { name: /distribución semanal/i })).toBeVisible();
    await expect(page.getByText(/elegí una comisión por materia/i)).not.toBeVisible();
  });

  test('guardar la combinación como borrador y verla en Borradores', async ({ page }) => {
    await openBuilder(page);
    await addFirstAvailableSubject(page);

    const label = `E2E ${Date.now()}`;
    await saveDraft(page, label);

    await page.getByRole('link', { name: /borradores/i }).click();
    await expect(page.getByText(label)).toBeVisible({ timeout: 20_000 });
  });

  test('compartir un borrador y verlo en Comunidad', async ({ page }) => {
    await openBuilder(page);
    await addFirstAvailableSubject(page);

    const label = `E2E share ${Date.now()}`;
    await saveDraft(page, label);

    await page.getByRole('link', { name: /borradores/i }).click();
    const card = page.locator('article', { hasText: label });
    await expect(card).toBeVisible({ timeout: 20_000 });

    // Compartir pide confirmación explicando que se publica sin su nombre (US-024).
    await card.getByRole('button', { name: /^compartir$/i }).click();
    const shareDialog = page.getByRole('dialog');
    await expect(shareDialog).toBeVisible();
    await expect(shareDialog.getByText(/sin tu nombre/i)).toBeVisible();
    await shareDialog.getByRole('button', { name: /^compartir borrador$/i }).click();

    await expect(card.getByText(/^compartido$/i)).toBeVisible({ timeout: 20_000 });

    // Aparece en el feed de la comunidad del mismo plan + período, anonimizado.
    await page.getByRole('link', { name: /^comunidad$/i }).click();
    await expect(page.getByText(label)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/otro alumno de tu plan/i).first()).toBeVisible();
  });

  test('publicar un borrador lo vuelve el plan en curso', async ({ page }) => {
    await openBuilder(page);
    await addFirstAvailableSubject(page);

    const label = `E2E publish ${Date.now()}`;
    await saveDraft(page, label);

    await page.getByRole('link', { name: /borradores/i }).click();
    const card = page.locator('article', { hasText: label });
    await expect(card).toBeVisible({ timeout: 20_000 });

    await card.getByRole('button', { name: /^publicar$/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('button', { name: /^publicar/i })
      .last()
      .click();

    // Publicar navega a "En curso" con el período del borrador publicado.
    await expect(page).toHaveURL(/tab=active/, { timeout: 20_000 });
  });
});

/**
 * Deja la pantalla en la pestaña "En curso" (el builder). Absorbe las dos ramas del estado inicial:
 * si el alumno no tiene ningún borrador, el shell muestra el empty state global (que oculta las
 * pestañas) y hay que entrar por su CTA; si ya tiene, se entra por la pestaña.
 */
async function openBuilder(page: Page): Promise<void> {
  const firstDraftCta = page.getByRole('button', { name: /crear primer borrador/i });
  if (await firstDraftCta.isVisible().catch(() => false)) {
    await firstDraftCta.click();
  }
  const activeTab = page.getByRole('link', { name: /en curso/i });
  if (await activeTab.isVisible().catch(() => false)) {
    await activeTab.click();
  }
  await expect(page.getByRole('button', { name: /\+ agregar materia/i })).toBeVisible({
    timeout: 20_000,
  });
}

/** Suma la primera materia disponible del drawer (cuál toque depende del historial del alumno). */
async function addFirstAvailableSubject(page: Page): Promise<void> {
  await page.getByRole('button', { name: /\+ agregar materia/i }).click();
  const drawer = page.getByRole('dialog', { name: /agregar materia/i });
  await expect(drawer).toBeVisible();
  await drawer
    .getByRole('button', { name: /\+ sumar/i })
    .first()
    .click();
  await expect(drawer).not.toBeVisible();
}

/**
 * Elige la primera comisión ofrecida para la primera materia de la selección. Devuelve false si esa
 * materia no tiene oferta cargada en el período (el select solo trae "Sin elegir comisión"), que es
 * un estado válido del dominio y no una falla del test.
 */
async function pickFirstCommission(page: Page): Promise<boolean> {
  // El bloque "Comisión por materia" aparece con la primera materia sumada; adentro va un select por
  // materia CON oferta, o el aviso de que no hay oferta cargada. Esperamos el bloque, no el select.
  await expect(page.getByRole('heading', { name: /comisión por materia/i })).toBeVisible({
    timeout: 20_000,
  });

  const select = page.locator('select[aria-label^="Comisión de"]').first();
  if (!(await select.isVisible().catch(() => false))) {
    return false;
  }
  const options = await select.locator('option').all();
  if (options.length <= 1) {
    return false;
  }
  const value = await options[1].getAttribute('value');
  await select.selectOption(value as string);
  return true;
}

/**
 * Deja elegido el período que tiene oferta de comisiones sembrada (primer cuatrimestre de 2026). Si
 * ese período no está en el select (seed distinto), deja el que estaba: el test degrada al camino
 * "sin oferta cargada", que también es una aserción válida.
 */
async function selectTermWithOffering(page: Page): Promise<void> {
  const selector = page.getByLabel(/período lectivo/i);
  await expect(selector).toBeVisible();
  const option = selector.locator('option', { hasText: /2026.*1er cuatrimestre/i }).first();
  const value = await option.getAttribute('value').catch(() => null);
  if (value) {
    await selector.selectOption(value);
    await expect(page.getByRole('button', { name: /\+ agregar materia/i })).toBeVisible({
      timeout: 20_000,
    });
  }
}

/** Guarda la combinación actual como borrador con el label dado. */
async function saveDraft(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: /guardar como borrador/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/nombre/i).fill(label);
  await dialog.getByRole('button', { name: /^guardar borrador$/i }).click();
  await expect(dialog).not.toBeVisible({ timeout: 20_000 });
}
