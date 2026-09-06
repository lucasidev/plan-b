import type { APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';
import type { CreatedStudent } from './students';

/**
 * Materia 211 (Fundamentos de Control de Calidad) y su cátedra Pérez: el par sembrado que
 * `publishByApi` usa para dejar una cátedra con voces de verdad. Compartido entre specs porque
 * una cátedra publica desde 10 reseñas (ver `PublishingRulesTests.cs`): reusar el mismo par evita
 * que cada spec tenga que armar su propia cátedra descartable (`helpers/chairs.ts`) para un caso
 * que no lo necesita.
 */
export const SUBJECT_211 = '00000004-0000-4000-a000-000000000012';
export const CHAIR_PEREZ = '00000008-0000-4000-a000-000000000001';

/**
 * Lleva a Pérez sobre el piso por API. Es fixture, no el flujo bajo prueba: reseñar ya tiene su
 * propio spec, y lo que necesitan `path-to-the-ficha.spec.ts` y `accessibility.spec.ts` es una
 * cátedra que ya publica, no el paso de reseñar en sí.
 */
export async function publishByApi(
  request: APIRequestContext,
  student: CreatedStudent,
  termId: string,
  outcome: number,
): Promise<void> {
  const signIn = await request.post('/api/identity/sign-in', {
    data: { email: student.email, password: student.password },
  });
  expect(signIn.ok(), `sign-in de ${student.email}`).toBeTruthy();

  const published = await request.post('/api/reviews/courses', {
    data: {
      subjectId: SUBJECT_211,
      termId,
      chairId: CHAIR_PEREZ,
      answers: [
        { itemCode: 'COURSE_OUTCOME', optionValue: outcome },
        { itemCode: 'CHAIR_ANSWERS_IN_CLASS', optionValue: 3 },
        { itemCode: 'CHAIR_CLASSES_HELD', optionValue: 3 },
      ],
      freeText: null,
    },
  });
  expect(published.status(), `publicar para ${student.email}`).toBe(201);
}
