import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import type { Result } from 'axe-core';
import { CHAIR_PEREZ, publishByApi, SUBJECT_211 } from '../helpers/reviews';
import { type CreatedStudent, createStudent, deleteStudent } from '../helpers/students';

/**
 * Accesibilidad WCAG 2.2 AA sobre las rutas públicas, con axe (`@axe-core/playwright`).
 *
 * Una `test` por ruta, no un loop dentro de un solo test: cada ruta necesita su propio
 * pass/fail y un loop escondería cuál ruta falló detrás de un solo resultado.
 *
 * El fixture (diez voces sobre Pérez, materia 211) es compartido por las ocho rutas: sin una
 * cátedra publicando, la ficha de cátedra y de materia rendereían un esqueleto vacío en vez del
 * contenido real, y la ficha de carrera necesita esa misma cátedra para tener cobertura > 0%. Se
 * arma una sola vez en `beforeAll` (modo `serial`: si corriera en paralelo, cada worker que tocara
 * este archivo repetiría las diez altas).
 *
 * Una violación real no se apaga con `disableRules`: eso escondería exactamente lo que este spec
 * existe para encontrar. Se documenta y la `test` de esa ruta pasa a cuarentena con `test.fixme`,
 * la marca `hasta YYYY-MM-DD` y el issue (`#NNN`), como pide `docs/engineering/testing.md`.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Un período por reseña: la unidad es cuenta × materia × período (igual que path-to-the-ficha).
const TERMS = [
  '00000005-0000-4000-a000-000000000001',
  '00000005-0000-4000-a000-000000000002',
  '00000005-0000-4000-a000-000000000003',
  '00000005-0000-4000-a000-000000000004',
  '00000005-0000-4000-a000-000000000005',
  '00000005-0000-4000-a000-000000000006',
];

// Carrera TUDCS UNSTA: la misma cuya materia 211 recibe el fixture, así que su cobertura no
// queda en 0% (AcademicSeedData.cs).
const CAREER_TUDCS = '00000002-0000-4000-a000-000000000003';
// Docente Pérez, el mismo apellido que la cátedra que publica (ChairCatalogTests.cs).
const TEACHER_PEREZ = '00000006-0000-4000-a000-00000000000b';
// Universidad UNSTA: la que declaran los alumnos del fixture (helpers/students.ts).
const UNIVERSITY_SLUG = 'unsta';

/** Las ocho rutas que estas restricciones miden, con la etiqueta que usa cada `test`. */
const PUBLIC_ROUTES: { label: string; path: string }[] = [
  { label: '/', path: '/' },
  { label: '/method', path: '/method' },
  { label: '/subjects/[id]', path: `/subjects/${SUBJECT_211}` },
  { label: '/chairs/[id]', path: `/chairs/${CHAIR_PEREZ}` },
  { label: '/careers/[id]', path: `/careers/${CAREER_TUDCS}` },
  { label: '/teachers/[id]', path: `/teachers/${TEACHER_PEREZ}` },
  { label: '/universities', path: '/universities' },
  { label: '/universities/[slug]/careers', path: `/universities/${UNIVERSITY_SLUG}/careers` },
];

/**
 * Los primeros tres nodos de cada violación alcanzan para ubicarla sin abrir el reporte HTML: más
 * que eso satura la salida de la terminal sin sumar información nueva.
 */
function describeViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n) => `      ${n.html}`)
        .join('\n');
      return `- ${v.id} (${v.impact}): ${v.description}\n${nodes}`;
    })
    .join('\n');
}

/** Navega, espera a que el esqueleto de carga se vaya (igual que path-to-the-ficha.spec.ts) y corre axe. */
async function auditRoute(page: Page): Promise<Result[]> {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations;
}

test.describe('Accesibilidad WCAG 2.2 AA en las rutas públicas', () => {
  test.describe.configure({ mode: 'serial' });

  const students: CreatedStudent[] = [];

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    for (let i = 0; i < 10; i++) {
      const student = await createStudent(request, { emailPrefix: `e2e-a11y-${i}` });
      students.push(student);
      await publishByApi(request, student, TERMS[i % TERMS.length], i < 7 ? 1 : 3);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const student of students) {
      await deleteStudent(request, student);
    }
  });

  test('/ no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto('/');
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/method no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto('/method');
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/subjects/[id] no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto(`/subjects/${SUBJECT_211}`);
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/chairs/[id] no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto(`/chairs/${CHAIR_PEREZ}`);
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/careers/[id] no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto(`/careers/${CAREER_TUDCS}`);
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/teachers/[id] no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto(`/teachers/${TEACHER_PEREZ}`);
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/universities no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto('/universities');
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  test('/universities/[slug]/careers no tiene violaciones de accesibilidad', async ({ page }) => {
    await page.goto(`/universities/${UNIVERSITY_SLUG}/careers`);
    const violations = await auditRoute(page);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  /**
   * WCAG 2.2 AA 1.4.10 (Reflow): axe no lo cubre con análisis estático porque hace falta un
   * viewport chico de verdad para que un overflow aparezca. Un solo test para las ocho rutas
   * (no hace falta la granularidad por ruta de arriba: acá alcanza con `expect.soft` para ver
   * todas las que desbordan en la misma corrida, no solo la primera). Corre bajo cualquier
   * proyecto, pero solo es interesante bajo `mobile` (viewport chico): en `parallel` (1280px) un
   * desborde sería un bug mucho más grave.
   */
  test('ninguna ruta pública tiene scroll horizontal', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect
        .soft(overflow, `${route.label} desborda ${overflow}px de ancho de viewport`)
        .toBeLessThanOrEqual(0);
    }
  });
});
