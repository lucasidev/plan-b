import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de /help (US-073). Página authenticated, requiere login. Verifica:
 *  - Sidebar muestra "Ayuda" en sección "Otros" y navega.
 *  - FAQ accordions abren/cierran y muestran respuesta.
 *  - Card "Hablá con nosotros" tiene mailto al support email.
 *  - Card "Recursos" lista los 4 ítems del MVP.
 *
 * El form de contacto descrito en el doc US-073 NO se testea porque no se implementa en
 * MVP (deuda hasta que aterrice Notifications BC + `POST /api/support/contact`).
 */

test.describe('Ayuda (US-073)', () => {
  // Dev frontend (turbopack JIT) compila la primera vez ~10s; bumpeamos el budget.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // El sidebar v2 tiene "Ayuda" en sección "Otros" (config en lib/member-shell.ts).
    await page.getByRole('link', { name: /^ayuda$/i }).click();
    await expect(page).toHaveURL(/\/help$/, { timeout: 30_000 });
    await expect(
      page.getByRole('heading', { name: /^¿cómo te ayudamos\?$/i, level: 1 }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('FAQ renderea las 5 preguntas y permite expandir una', async ({ page }) => {
    // 5 entries del FAQ.
    await expect(page.getByRole('button', { name: /cómo funciona el período/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cómo armar un borrador/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /cómo se calcula la dificultad/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /por qué tus reseñas son anónimas/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /atajos del teclado/i })).toBeVisible();

    // El primer item arranca cerrado; al click, se expande y muestra la respuesta.
    const firstTrigger = page.getByRole('button', { name: /cómo funciona el período/i });
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/cuatrimestre académico actual/i)).toBeVisible();

    // Click en otro item cierra el primero y abre el nuevo (single-open behavior).
    const secondTrigger = page.getByRole('button', { name: /cómo armar un borrador/i });
    await secondTrigger.click();
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('contact card muestra mailto al support email', async ({ page }) => {
    await expect(page.getByText(/hablá con nosotros/i)).toBeVisible();
    await expect(page.getByText(/algo no cierra o ves un dato mal/i)).toBeVisible();

    const chatLink = page.getByRole('link', { name: /abrir chat de soporte/i });
    await expect(chatLink).toBeVisible();
    await expect(chatLink).toHaveAttribute('href', /^mailto:hola@plan-b\.app/);

    const emailLink = page.getByRole('link', { name: /hola@plan-b\.app/i });
    await expect(emailLink).toBeVisible();
  });

  test('recursos lista los 4 ítems del MVP', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^recursos$/i })).toBeVisible();
    await expect(page.getByText(/guía rápida/i)).toBeVisible();
    await expect(page.getByText(/política de moderación/i)).toBeVisible();
    await expect(page.getByText(/términos y privacidad/i)).toBeVisible();
    await expect(page.getByText(/estado del servicio/i)).toBeVisible();
  });
});
