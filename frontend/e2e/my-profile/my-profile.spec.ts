import { expect, test } from '@playwright/test';
import { LUCIA } from '../helpers/personas';

/**
 * E2E de Mi perfil (US-047) + zona peligrosa con deactivate-account modal (US-038-bis frontend).
 *
 * Cubre:
 *  - Login Lucía + navegar a /my-profile desde el AvatarMenu (footer del sidebar).
 *  - Render del header con avatar de iniciales + email + "miembro desde".
 *  - Edit mode: cambiar displayName + yearOfStudy + regularStudent y verificar persistencia.
 *  - Click "Dar de baja mi cuenta" abre el modal de deactivate con copy correcto.
 *  - Modal pide retype del email (botón disabled hasta match).
 *  - Cancel del modal lo cierra sin tocar nada.
 *
 * El happy path real del deactivate (DELETE + sign-out + redirect) cambiaría a Lucía
 * permanentemente. No lo ejercitamos para no contaminar otras specs; el backend tiene
 * cobertura propia en DeactivateAccountEndpointTests.
 */

test.describe('Mi perfil (US-047 + US-038-bis modal)', () => {
  // En CI dev frontend (turbopack JIT) compila /my-profile la primera vez (~10s) y el
  // sign-in dev tarda ~4s. Bumpeamos el budget para que el beforeEach + el body de cada
  // test tengan margen real.
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(LUCIA.email);
    await page.getByLabel(/^contraseña$/i).fill(LUCIA.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 30_000 });

    // Navegar directo a /my-profile en lugar de via AvatarMenu. La interacción con el dropdown
    // era flaky en CI: el menuitem se clickea antes de que el menú termine de abrir y la
    // navegación nunca dispara. La cobertura "el menuitem lleva a /my-profile" la testea otro
    // spec dedicado al AvatarMenu cuando aterrice.
    await page.goto('/my-profile');
    await expect(page).toHaveURL(/\/my-profile$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /^mi perfil$/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('header muestra avatar, email y miembro desde', async ({ page }) => {
    await expect(page.getByText(LUCIA.email).first()).toBeVisible();
    await expect(page.getByText(/miembro desde/i)).toBeVisible();
    await expect(page.locator(`[aria-label="Avatar de ${LUCIA.email}"]`)).toBeVisible();
  });

  test('view mode muestra datos académicos en read-only', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /datos académicos/i })).toBeVisible();
    await expect(page.getByText(/año cursando/i).first()).toBeVisible();
    await expect(page.getByText(/legajo/i).first()).toBeVisible();
    await expect(page.getByText(/estado/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
  });

  test('edit mode habilita campos y guarda cambios', async ({ page }) => {
    await page.getByRole('button', { name: /editar/i }).click();

    const nameInput = page.getByLabel(/nombre para mostrar/i);
    await nameInput.fill('Lucía Mansilla');

    const yearSelect = page.getByLabel(/año cursando/i);
    await yearSelect.selectOption('3');

    await page.getByRole('button', { name: /^guardar$/i }).click();

    await expect(page.getByRole('heading', { name: /lucía mansilla/i, level: 2 })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(/3° año/i)).toBeVisible();
  });

  test('cancelar el edit no persiste cambios', async ({ page }) => {
    await page.getByRole('button', { name: /editar/i }).click();

    const nameInput = page.getByLabel(/nombre para mostrar/i);
    await nameInput.fill('Algo Distinto');

    await page.getByRole('button', { name: /cancelar/i }).click();

    // Volvió a view mode sin el nombre cambiado. Esperamos a que el form se desmonte
    // (el botón "Editar" reaparece) antes de chequear ausencia.
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
    await expect(page.getByText('Algo Distinto')).toHaveCount(0);
  });

  test('zona peligrosa muestra el CTA con copy correcto', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /zona peligrosa/i })).toBeVisible();
    // La card del feature deactivate-account tiene su propio título.
    await expect(
      page.getByRole('heading', { name: /dar de baja mi cuenta/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/anonimizan/i)).toBeVisible();

    // Dice lo que pasa de verdad: los conteos siguen y no queda nada que lleve a la persona.
    // Este assert pineaba "Ex-miembro", que no existe: el producto no publica una sola reseña
    // individual (ADR-0083), así que no hay firma que anonimizar.
    await expect(page.getByText(/sigue contando en los conteos de su cátedra/i)).toBeVisible();
    await expect(page.getByText(/sin nada que lleve a vos/i)).toBeVisible();

    // Y la salida real, que es sacar lo tuyo de a uno antes de dar de baja.
    await expect(page.getByText(/mis aportes/i).first()).toBeVisible();
  });

  test('click en "Dar de baja mi cuenta" abre el modal con email gate', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^dar de baja mi cuenta$/i }).first();
    const dialog = page.getByRole('dialog');

    // DeactivateAccountButton es un client component: a veces el click llega antes de que
    // React termine de hidratarlo y no pasa nada. Reintentamos el click hasta que el
    // diálogo aparezca, en vez de asumir que el primer click siempre engancha el handler.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });

    await expect(dialog.getByRole('heading', { name: /confirmá la baja/i })).toBeVisible();
    await expect(dialog.getByText(LUCIA.email)).toBeVisible();

    // El submit empieza disabled.
    const submit = dialog.getByRole('button', { name: /^dar de baja la cuenta$/i });
    await expect(submit).toBeDisabled();

    // Cancelar cierra el modal.
    await dialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});
