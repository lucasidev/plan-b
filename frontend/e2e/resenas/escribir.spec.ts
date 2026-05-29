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
    await page.goto('/resenas/escribir/cursada-demo-isw301');
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });

    // Card de contexto: matCode + materia + docente.
    await expect(page.getByText('ISW301')).toBeVisible();
    await expect(page.getByText(/ingeniería de software i/i)).toBeVisible();
    await expect(page.getByText(/brandt/i)).toBeVisible();

    // Campos numerados 01..06 en orden.
    await expect(page.getByText('01')).toBeVisible();
    await expect(page.getByText(/cómo te pareció la cursada/i)).toBeVisible();
    await expect(page.getByText('02')).toBeVisible();
    await expect(page.getByText(/qué tan difícil/i)).toBeVisible();
    await expect(page.getByText('06')).toBeVisible();

    // Radio de 1 estrella debe existir.
    await expect(page.getByRole('radio', { name: /1 estrella$/i })).toBeVisible();

    // Chip "claro explicando" del set de tags.
    await expect(page.getByRole('checkbox', { name: /claro explicando/i })).toBeVisible();

    // Preview lateral con el badge y el placeholder italic.
    await expect(page.getByText(/verificado que cursó/i)).toBeVisible();
    await expect(page.getByText(/tu texto aparecerá acá/i)).toBeVisible();

    // Boton Publicar arranca disabled (rating y difficulty siguen en 0).
    const publish = page.getByRole('button', { name: /publicar reseña/i });
    await expect(publish).toBeDisabled();
  });

  test('elegir rating y difficulty habilita el boton de publicar', async ({ page }) => {
    await page.goto('/resenas/escribir/cursada-demo-isw301');
    await expect(page.getByRole('heading', { name: /reseñá tu cursada/i })).toBeVisible({
      timeout: 30_000,
    });

    const publish = page.getByRole('button', { name: /publicar reseña/i });
    await expect(publish).toBeDisabled();

    await page.getByRole('radio', { name: /4 estrellas/i }).check();
    await expect(publish).toBeDisabled(); // todavia falta difficulty

    // Difficulty step 3 = "justa"
    await page.locator('input[type="radio"][name="field-difficulty-radio"][value="3"]').check();

    await expect(publish).toBeEnabled();
  });
});
