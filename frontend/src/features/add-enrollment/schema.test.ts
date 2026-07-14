import { describe, expect, it } from 'vitest';
import { addEnrollmentSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). El schema tiene 5 refines cross-field
 * que re-validan localmente lo que el aggregate `EnrollmentRecord` exige en el backend
 * (US-013-f). Cubrimos el caso válido y el inválido de cada refine.
 */
describe('addEnrollmentSchema', () => {
  const base = {
    subjectId: '11111111-1111-4111-a111-111111111111',
  };

  it('acepta un input mínimo válido (Reprobada, sin extras)', () => {
    const result = addEnrollmentSchema.safeParse({
      ...base,
      status: 'Reprobada',
    });
    expect(result.success).toBe(true);
  });

  describe('refine: Aprobada requiere approvalMethod', () => {
    it('rechaza Aprobada sin approvalMethod', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        grade: 8,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('approvalMethod'));
        expect(issue?.message).toBe('Aprobada requiere forma de aprobación.');
      }
    });

    it('acepta Aprobada con approvalMethod y grade', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'Cursada',
        grade: 8,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refine: Aprobada/Regular requieren grade', () => {
    it('rechaza Regular sin grade', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Regular',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('grade'));
        expect(issue?.message).toBe('La nota es obligatoria.');
      }
    });

    it('acepta Regular con grade', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Regular',
        grade: 6,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refine: Cursando requiere termId', () => {
    it('rechaza Cursando sin termId', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Cursando',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('termId'));
        expect(issue?.message).toBe('Indicá el cuatrimestre.');
      }
    });

    it('acepta Cursando con termId', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Cursando',
        termId: '22222222-2222-4222-a222-222222222222',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refine: Equivalencia prohíbe commission/term', () => {
    it('rechaza Equivalencia con commissionId', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'Equivalencia',
        grade: 8,
        commissionId: '33333333-3333-4333-a333-333333333333',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('approvalMethod'));
        expect(issue?.message).toBe('Equivalencia no lleva comisión ni cuatrimestre.');
      }
    });

    it('rechaza Equivalencia con termId', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'Equivalencia',
        grade: 8,
        termId: '44444444-4444-4444-a444-444444444444',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('approvalMethod'));
        expect(issue?.message).toBe('Equivalencia no lleva comisión ni cuatrimestre.');
      }
    });

    it('acepta Equivalencia sin commission ni term', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'Equivalencia',
        grade: 8,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refine: FinalLibre requiere term sin commission', () => {
    it('rechaza FinalLibre sin termId', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'FinalLibre',
        grade: 9,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('approvalMethod'));
        expect(issue?.message).toBe('Final libre requiere cuatrimestre sin comisión.');
      }
    });

    it('rechaza FinalLibre con commissionId presente', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'FinalLibre',
        grade: 9,
        termId: '55555555-5555-4555-a555-555555555555',
        commissionId: '66666666-6666-4666-a666-666666666666',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('approvalMethod'));
        expect(issue?.message).toBe('Final libre requiere cuatrimestre sin comisión.');
      }
    });

    it('acepta FinalLibre con termId sin commission', () => {
      const result = addEnrollmentSchema.safeParse({
        ...base,
        status: 'Aprobada',
        approvalMethod: 'FinalLibre',
        grade: 9,
        termId: '77777777-7777-4777-a777-777777777777',
      });
      expect(result.success).toBe(true);
    });
  });
});
