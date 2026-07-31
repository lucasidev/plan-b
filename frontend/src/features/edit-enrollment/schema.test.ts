import { describe, expect, it } from 'vitest';
import { editEnrollmentSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036).
 *
 * Las cinco invariantes cross-field están cubiertas caso por caso en
 * `add-enrollment/schema.test.ts`: son literalmente las mismas reglas
 * (`lib/enrollment-invariants.ts`) y volver a enumerarlas acá sería duplicar cobertura, no sumarla.
 * Lo que sí es propio de la edición es que la materia no viaja y que las invariantes están
 * efectivamente enganchadas a este schema.
 */
describe('editEnrollmentSchema', () => {
  it('acepta un payload sin subjectId (la materia no se edita)', () => {
    const result = editEnrollmentSchema.safeParse({
      status: 'Passed',
      approvalMethod: 'Coursework',
      grade: 8,
    });
    expect(result.success).toBe(true);
  });

  it('ignora un subjectId si igual viene (no lo propaga al PATCH)', () => {
    const result = editEnrollmentSchema.safeParse({
      subjectId: '11111111-1111-4111-a111-111111111111',
      status: 'Failed',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('subjectId');
    }
  });

  it('aplica las invariantes compartidas (Cursando requiere cuatrimestre)', () => {
    const result = editEnrollmentSchema.safeParse({ status: 'InProgress' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('termId'));
      expect(issue?.message).toBe('Indicá el cuatrimestre.');
    }
  });
});
