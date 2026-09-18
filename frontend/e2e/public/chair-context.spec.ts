import { expect, test } from '@playwright/test';
import { ADMIN, LUCIA } from '../helpers/personas';

const SUBJECT = '00000004-0000-4000-a000-000000000012';
const CHAIR = '00000008-0000-4000-a000-000000000001';
const CAREER = '00000002-0000-4000-a000-000000000003';
const PLAN = '00000003-0000-4000-a000-000000000003';
const selection = `/reviews/new?subjectId=${SUBJECT}&chairId=${CHAIR}`;

// US-147 E2: la selección de la ficha llega al formulario después del ingreso.
test('la ficha conserva el contexto al ingresar y el alumno declara el período', async ({
  page,
}) => {
  await page.goto(`/chairs/${CHAIR}`);
  const crumbs = page.locator('nav[aria-label="Dónde estás"]:visible');
  await expect(crumbs.locator('a[href="/universities/unsta/careers"]')).toBeVisible();
  await expect(crumbs.locator(`a[href="/careers/${CAREER}"]`)).toBeVisible();
  await expect(crumbs.locator(`a[href="/plans/${PLAN}/subjects"]`)).toBeVisible();
  await expect(crumbs.locator(`a[href="/subjects/${SUBJECT}"]`)).toBeVisible();
  await expect(page.getByRole('link', { name: '¿La cursaste? Reseñala' })).toHaveAttribute(
    'href',
    `/sign-in?from=${encodeURIComponent(selection)}`,
  );
  await page.getByRole('link', { name: '¿La cursaste? Reseñala' }).click();
  await page.getByLabel(/tu email/i).fill(LUCIA.email);
  await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(selection);
  await expect(
    page.getByRole('button', { name: /Fundamentos de Control de Calidad/i }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Pérez', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '2026-C1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('el admin lee la ficha sin recibir una acción de alumno', async ({ page }) => {
  await page.goto(`/sign-in?from=${encodeURIComponent(`/chairs/${CHAIR}`)}`);
  await page.getByLabel(/tu email/i).fill(ADMIN.email);
  await page.getByLabel(/^contraseña$/i).fill(ADMIN.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page).toHaveURL(`/chairs/${CHAIR}`);
  await expect(page.getByRole('link', { name: '¿La cursaste? Reseñala' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Escribir reseña', exact: true })).toHaveCount(0);
});

test('un enlace con cátedra ajena no la selecciona ni cambia el perfil', async ({ page }) => {
  const invalid = `/reviews/new?subjectId=${SUBJECT}&chairId=00000000-0000-4000-a000-000000000099`;
  await page.goto(`/sign-in?from=${encodeURIComponent(invalid)}`);
  await page.getByLabel(/tu email/i).fill(LUCIA.email);
  await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page.getByText(/No pudimos usar la cursada del enlace/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'No me acuerdo', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Pérez', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('link', { name: 'Revisar mi carrera y plan' })).toHaveAttribute(
    'href',
    '/my-profile',
  );
});
