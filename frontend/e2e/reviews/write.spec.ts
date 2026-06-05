import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E smoke test del editor de resena (US-049).
 *
 * Lo unico que verifica es que la pantalla renderee con los 6 campos numerados, el card
 * de contexto y el preview lateral. La logica del submit es mock (no toca backend, ver
 * actions.ts); la integracion real llega con el rework backend.
 *
 * Por que esta US tiene E2E pese a ser frontend-only mock: el editor es la primera vez
 * que aparece un componente de 6 campos coordinados con preview en vivo. Vale tener un
 * smoke test que confirme que el render no crashea, los inputs accesibles existen y el
 * boton de Publicar arranca disabled (porque rating y difficulty parten en sentinel 0).
 */
test.describe('Editor de resena (US-049)', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });
  });

  test('renderea los 6 campos numerados y el preview', async ({ page }) => {
    await page.goto('/reviews/write/cursada-demo-isw301');
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });

    // Card de contexto: matCode + materia + docente.
    await expect(page.getByText('ISW301')).toBeVisible();
    await expect(page.getByText(/ingeniería de software i/i)).toBeVisible();
    await expect(page.getByText(/brandt/i)).toBeVisible();

    // Los 6 campos están presentes. Identifico por la pregunta/label, no por el número
    // "01..06" porque el sidebar también tiene textos cortos similares (ej. ⌘1).
    await expect(page.getByText(/cómo te pareció la cursada/i)).toBeVisible();
    await expect(page.getByText(/qué tan difícil/i)).toBeVisible();
    await expect(page.getByText(/cuántas horas estudiabas/i)).toBeVisible();
    await expect(page.getByText(/etiquetá la cursada/i)).toBeVisible();
    await expect(page.getByText(/contá tu experiencia/i)).toBeVisible();
    await expect(page.getByText(/dos preguntas rápidas/i)).toBeVisible();

    // Radio de 1 estrella debe existir (visualmente oculto, accesible via name).
    await expect(page.getByRole('radio', { name: /1 estrella$/i })).toBeAttached();

    // Chip "claro explicando" del set de tags.
    await expect(page.getByRole('checkbox', { name: /claro explicando/i })).toBeAttached();

    // Preview lateral con el badge y el placeholder italic. "VERIFICADO QUE CURSÓ"
    // exact-match porque también aparece (en minúscula) en el copy del privacy card.
    await expect(page.getByText('VERIFICADO QUE CURSÓ', { exact: true })).toBeVisible();
    await expect(page.getByText(/tu texto aparecerá acá/i)).toBeVisible();

    // Boton Publicar arranca disabled (rating y difficulty siguen en 0).
    const publish = page.getByRole('button', { name: /publicar reseña/i });
    await expect(publish).toBeDisabled();
  });

  test('elegir rating y difficulty habilita el boton de publicar', async ({ page }) => {
    await page.goto('/reviews/write/cursada-demo-isw301');
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });

    const publish = page.getByRole('button', { name: /publicar reseña/i });
    await expect(publish).toBeDisabled();

    // Los inputs radio son sr-only; el click va al <label> envolvente.
    await page.locator('label:has(input[name="field-rating-radio"][value="4"])').click();
    await expect(publish).toBeDisabled(); // todavia falta difficulty

    await page.locator('label:has(input[name="field-difficulty-radio"][value="3"])').click();

    await expect(publish).toBeEnabled();
  });
});
