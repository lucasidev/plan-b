import { expect, test } from '@playwright/test';

/**
 * E2E de Método (SC-021, US-130, #373).
 *
 * El criterio del issue: cada número que el producto publica se puede rastrear hasta la regla que
 * lo calculó, **sin leer código**. Y sin cuenta: poder auditar un número no puede depender de tener
 * usuario (US-168).
 *
 * Lo que más importa acá no es que la pantalla renderice, es que **se llegue a ella**. Método se
 * prometió tres veces sin cumplirse, y una pantalla a la que solo se llega tipeando la URL es una
 * que nadie lee.
 */

const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';

test.describe('Método (US-130)', () => {
  test('se lee sin cuenta y publica las reglas con sus razones', async ({ page }) => {
    await page.goto('/method');

    await expect(
      page.getByRole('heading', { name: /cómo se calcula lo que publicamos/i }),
    ).toBeVisible();

    // El piso, con su razón: es de privacidad, no de estadística. Esa distinción es la story.
    await expect(page.getByText(/privacidad de quien reseña/i)).toBeVisible();

    // Por qué nada se promedia, que es lo que hace verificable a los conteos.
    await expect(page.getByText(/nada se promedia/i).first()).toBeVisible();

    // El sesgo declarado en vez de corregido con una ponderación que nadie puede auditar.
    await expect(page.getByText(/de quienes reseñaron/i).first()).toBeVisible();
  });

  test('publica el cuestionario entero, que es lo que hace auditable un porcentaje', async ({
    page,
  }) => {
    await page.goto('/method');

    await expect(page.getByRole('heading', { name: /qué se pregunta/i })).toBeVisible();

    // Las tres capas de la reseña, cada una con qué es y si se publica.
    await expect(page.getByText(/contexto de la cursada/i)).toBeVisible();
    await expect(page.getByText(/qué hizo la cátedra/i)).toBeVisible();
    await expect(page.getByText(/qué te pasó a vos/i)).toBeVisible();

    // El contexto no se publica, y la pantalla lo dice donde corresponde.
    await expect(page.getByText(/no se publica\. sirve para leer bien el resto/i)).toBeVisible();
  });

  test('se llega desde la ficha de una materia, sin tipear la URL', async ({ page }) => {
    await page.goto(`/subjects/${SUBJECT_211}`);

    await page.getByRole('link', { name: /cómo calculamos esto/i }).click();

    await expect(page).toHaveURL(/\/method$/);
    await expect(
      page.getByRole('heading', { name: /cómo se calcula lo que publicamos/i }),
    ).toBeVisible();
  });

  test('no promete puntajes ni rankings en ningún lado', async ({ page }) => {
    await page.goto('/method');

    const text = (await page.locator('body').textContent()) ?? '';
    // Los menciona para decir que no existen, así que se chequea la forma que tendría publicarlos.
    expect(text).not.toMatch(/★|sobre 5|de 1 a 10|puntaje de/i);
  });
});
