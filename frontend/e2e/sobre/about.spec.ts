import { expect, test } from '@playwright/test';

/**
 * E2E de /sobre (US-074). Página pública, no requiere auth. Verifica que el contenido
 * estático (hero + cards de manifiesto, equipo, números, universidades, open source) renderea
 * sin errores y los links externos apuntan donde corresponde.
 */

test.describe('Sobre plan-b (US-074)', () => {
  // Dev frontend (turbopack JIT) compila la primera vez ~10s; bumpeamos el budget.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/sobre');
    await expect(page).toHaveURL(/\/sobre$/);
  });

  test('hero renderea headline y lede', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /estamos haciendo la app que nos hubiera gustado tener/i,
        level: 1,
      }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/herramienta de planificación académica/i)).toBeVisible();
  });

  test('cards principales renderean (manifiesto + equipo + números + roadmap + universidades + open source)', async ({
    page,
  }) => {
    await expect(page.getByText(/^manifiesto$/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/la universidad te da un pdf/i)).toBeVisible();

    await expect(page.getByText(/^equipo$/i)).toBeVisible();
    await expect(page.getByText(/lucas iriarte/i)).toBeVisible();
    await expect(page.getByText(/proyecto final 2026.+ing\. elio copas.+unsta/i)).toBeVisible();

    await expect(page.getByText(/^números$/i)).toBeVisible();
    await expect(page.getByText('340')).toBeVisible();

    await expect(page.getByText(/^lo que viene$/i)).toBeVisible();
    await expect(page.getByText(/^ahora$/i)).toBeVisible();

    await expect(page.getByText(/^universidades$/i)).toBeVisible();
    // Hay 2 matches: el `<li>` de la lista y el `<p>` del contexto académico ("Proyecto
    // Final ... UNSTA"). Usamos `.first()` para chequear que el `<li>` está presente.
    await expect(page.getByText(/universidad del norte santo tomás/i).first()).toBeVisible();

    await expect(page.getByText(/es código abierto/i)).toBeVisible();
  });

  test('link al repo apunta a github con target blank', async ({ page }) => {
    const repoLink = page.getByRole('link', { name: /github\.com\/lucasidev\/plan-b/i });
    await expect(repoLink).toBeVisible({ timeout: 15_000 });
    await expect(repoLink).toHaveAttribute('href', 'https://github.com/lucasidev/plan-b');
    await expect(repoLink).toHaveAttribute('target', '_blank');
  });
});
