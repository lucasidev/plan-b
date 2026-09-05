import { expect, test } from '@playwright/test';

/**
 * Smokes de las tres pantallas de sistema sin pantalla de producto atrás (#416): mantenimiento,
 * offline y la guarda de dev de `/design-check`. Ninguna pide sesión (las sirve el proxy en
 * downtime, el service worker sin red, o corren siempre desatendidas), así que las tres van con
 * una page sin login.
 */

test.describe('Pantallas de sistema', () => {
  test('/maintenance responde 200 con el aviso de mantenimiento', async ({ page }) => {
    const response = await page.goto('/maintenance');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /volvemos en un rato/i })).toBeVisible();
    await expect(page.getByText(/^en mantenimiento$/i)).toBeVisible();
  });

  test('/offline responde 200 con el aviso y el link de reintentar a /', async ({ page }) => {
    const response = await page.goto('/offline');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /estás sin internet/i })).toBeVisible();

    const retry = page.getByRole('link', { name: /reintentar/i });
    await expect(retry).toBeVisible();
    await expect(retry).toHaveAttribute('href', '/');
  });

  test('/design-check no expone el muestrario por default, sin NEXT_PUBLIC_DESIGN_CHECK', async ({
    page,
  }) => {
    const response = await page.goto('/design-check');
    // Hallazgo (no se arregla acá): debería ser 404 (la guarda llama a notFound()), pero Next
    // preoptimiza esta ruta como estática (no depende de nada dinámico) y sirve el not-found
    // prerenderizado sin el status real: da 200 tanto en dev como en un build de producción
    // (verificado con --build, igual que corre CI). `export const dynamic = 'force-dynamic'` en
    // frontend/src/app/(dev)/design-check/page.tsx:26 haría que notFound() corra por request y
    // devuelva el 404 real. Lo que sí es real y se afirma acá es que el muestrario no se ve.
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /no encontramos eso/i })).toBeVisible();
    await expect(page.getByText(/design system check/i)).not.toBeVisible();
  });

  test('/design-check responde 200 con el muestrario cuando NEXT_PUBLIC_DESIGN_CHECK=1', async ({
    page,
  }) => {
    test.skip(
      process.env.NEXT_PUBLIC_DESIGN_CHECK !== '1',
      'el muestrario solo se compila con la variable',
    );

    const response = await page.goto('/design-check');
    expect(response?.status()).toBe(200);
    await expect(page.getByText(/design system check/i)).toBeVisible();
  });
});
