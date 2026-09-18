import { expect, test } from '@playwright/test';
import { ADMIN } from '../helpers/personas';
import { createStudent, deleteStudent } from '../helpers/students';

test('el admin encuentra un alumno, suspende el acceso y lo reactiva sin perder su perfil', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const student = await createStudent(request, { emailPrefix: 'e2e-manage-users' });
  try {
    await page.goto('/sign-in');
    await page.getByLabel(/tu email/i).fill(ADMIN.email);
    await page.getByLabel(/^contraseña$/i).fill(ADMIN.password);
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page).not.toHaveURL(/\/sign-in$/, { timeout: 30_000 });
    await page.getByRole('link', { name: 'Alumnos', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Alumnos', exact: true })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Buscar por email' }).fill(student.email);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: student.email });
    await expect(row).toContainText('Activa', { timeout: 15_000 });
    await expect(row).toContainText('Software');
    await row.getByRole('button', { name: 'Suspender acceso' }).click();
    await row.getByLabel('Motivo de la suspensión').fill('Revisión de acceso del test');
    await row.getByRole('button', { name: 'Confirmar suspensión' }).click();
    await expect(row).toContainText('Suspendida', { timeout: 15_000 });
    expect((await request.get('/api/me/student-profile')).status()).toBe(401);
    await row.getByRole('button', { name: 'Reactivar acceso' }).click();
    await expect(row).toContainText('Activa', { timeout: 15_000 });
    const signIn = await request.post('/api/identity/sign-in', {
      data: { email: student.email, password: student.password },
    });
    expect(signIn.ok()).toBeTruthy();
    const profile = await request.get('/api/me/student-profile');
    expect(profile.ok()).toBeTruthy();
    expect((await profile.json()).id).toBe(student.studentProfileId);
    expect((await request.get('/api/identity/users')).status()).toBe(403);
  } finally {
    await page.request.post(`/api/identity/users/${student.userId}/restore`);
    await deleteStudent(request, student);
  }
});

test('el catálogo se recorre desde una universidad y el menú separa cuestionarios y curaduría', async ({
  page,
}) => {
  const signIn = await page.request.post('/api/identity/sign-in', { data: ADMIN });
  expect(signIn.ok()).toBeTruthy();
  await page.goto('/admin/universities');
  const sidebar = page.locator('aside');
  await expect(sidebar.getByText('Catálogo académico', { exact: true })).toBeVisible();
  await expect(sidebar.getByText('Cuestionarios', { exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Preguntas', exact: true })).toBeVisible();
  await expect(
    sidebar.getByRole('link', { name: 'Comentarios y notas', exact: true }),
  ).toBeVisible();
  await expect(sidebar.getByText('Carreras', { exact: true })).toHaveCount(0);
  await expect(sidebar.getByText('Materias', { exact: true })).toHaveCount(0);
  const universityId = '00000001-0000-4000-a000-000000000001';
  await page.locator(`a[href="/admin/universities/${universityId}"]`).click();
  await page.getByRole('link', { name: 'Carreras y planes de estudio' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/universities/${universityId}/careers$`));
  await expect(page.getByRole('heading', { name: 'Carreras', exact: true })).toBeVisible();
  await sidebar.getByRole('link', { name: 'Preguntas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preguntas', exact: true })).toBeVisible();
});
