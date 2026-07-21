import { describe, expect, it } from 'vitest';
import { prerequisiteFieldsSchema, subjectFieldsSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre los rangos que espejan `Subject.Validate`
 * del backend (US-062): code/name obligatorios, yearInPlan 1-10, weeklyHours 1-40, totalHours
 * positivo y al menos la semanal, el invariante term_kind/term_in_year (anual sin número, el resto
 * con número 1-6), y el schema de correlativas (requiredSubjectId + type).
 */
describe('subjectFieldsSchema', () => {
  const base = {
    code: 'MAT101',
    name: 'Análisis Matemático I',
    yearInPlan: '1',
    termKind: 'Cuatrimestral',
    termInYear: '1',
    weeklyHours: '8',
    totalHours: '128',
    description: '',
  };

  it('acepta un input mínimo válido', () => {
    const result = subjectFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  describe('code', () => {
    it('rechaza vacío', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, code: '' });
      expect(result.success).toBe(false);
    });

    it('rechaza solo espacios', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, code: '   ' });
      expect(result.success).toBe(false);
    });

    it('rechaza más de 40 caracteres', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, code: 'M'.repeat(41) });
      expect(result.success).toBe(false);
    });

    it('trimea espacios', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, code: '  MAT101  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('MAT101');
      }
    });
  });

  describe('name', () => {
    it('rechaza vacío', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, name: '' });
      expect(result.success).toBe(false);
    });

    it('rechaza más de 200 caracteres', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, name: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe('yearInPlan', () => {
    it('coerciona el string a number', () => {
      const result = subjectFieldsSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yearInPlan).toBe(1);
      }
    });

    it('acepta el mínimo (1)', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, yearInPlan: '1' });
      expect(result.success).toBe(true);
    });

    it('acepta el máximo (10)', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, yearInPlan: '10' });
      expect(result.success).toBe(true);
    });

    it('rechaza 0', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, yearInPlan: '0' });
      expect(result.success).toBe(false);
    });

    it('rechaza 11', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, yearInPlan: '11' });
      expect(result.success).toBe(false);
    });

    it('rechaza un valor no entero', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, yearInPlan: '1.5' });
      expect(result.success).toBe(false);
    });
  });

  describe('termKind', () => {
    it('acepta Bimestral', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Bimestral',
        termInYear: '3',
      });
      expect(result.success).toBe(true);
    });

    it('acepta Semestral', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Semestral',
        termInYear: '1',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza un valor que no está en el enum', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, termKind: 'Trimestral' });
      expect(result.success).toBe(false);
    });

    it('rechaza vacío', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, termKind: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('cross-field: termKind/termInYear', () => {
    it('acepta Anual sin termInYear', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, termKind: 'Anual', termInYear: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.termInYear).toBeUndefined();
      }
    });

    it('rechaza Anual con termInYear presente', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, termKind: 'Anual', termInYear: '1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/anual.*no lleva número/i);
      }
    });

    it('rechaza una cadencia no anual sin termInYear', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Cuatrimestral',
        termInYear: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/elegí el cuatrimestre o bimestre/i);
      }
    });

    it('acepta el mínimo de termInYear (1) con una cadencia no anual', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Cuatrimestral',
        termInYear: '1',
      });
      expect(result.success).toBe(true);
    });

    it('acepta el máximo de termInYear (6) con una cadencia no anual', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Bimestral',
        termInYear: '6',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza termInYear 0', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Cuatrimestral',
        termInYear: '0',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza termInYear 7', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        termKind: 'Bimestral',
        termInYear: '7',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('weeklyHours', () => {
    it('acepta el mínimo (1)', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, weeklyHours: '1', totalHours: '1' });
      expect(result.success).toBe(true);
    });

    it('acepta 0 para materias sin carga semanal fija', () => {
      // Proyecto Final de la TUDCS: 0 hs/sem y 350 totales. No es un dato degenerado, es una
      // materia que no se cursa con horario semanal.
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '0',
        totalHours: '350',
      });
      expect(result.success).toBe(true);
    });

    it('acepta el máximo (40)', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '40',
        totalHours: '40',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza negativas', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, weeklyHours: '-1' });
      expect(result.success).toBe(false);
    });

    it('rechaza 41', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, weeklyHours: '41' });
      expect(result.success).toBe(false);
    });
  });

  describe('cross-field: totalHours >= weeklyHours', () => {
    it('acepta totalHours igual a weeklyHours', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '8',
        totalHours: '8',
      });
      expect(result.success).toBe(true);
    });

    it('acepta totalHours mayor a weeklyHours', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '8',
        totalHours: '128',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza totalHours menor a weeklyHours', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '10',
        totalHours: '5',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/al menos la semanal/i);
      }
    });

    it('rechaza totalHours 0', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        weeklyHours: '1',
        totalHours: '0',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('description', () => {
    it('acepta vacío (colapsa a undefined)', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, description: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('rechaza más de 500 caracteres', () => {
      const result = subjectFieldsSchema.safeParse({ ...base, description: 'A'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('acepta una descripción válida', () => {
      const result = subjectFieldsSchema.safeParse({
        ...base,
        description: 'Materia introductoria.',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('prerequisiteFieldsSchema', () => {
  const base = {
    requiredSubjectId: '00000005-0000-4000-a000-000000000001',
    type: 'ParaCursar',
  };

  it('acepta un input válido', () => {
    const result = prerequisiteFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('acepta ParaRendir', () => {
    const result = prerequisiteFieldsSchema.safeParse({ ...base, type: 'ParaRendir' });
    expect(result.success).toBe(true);
  });

  it('rechaza requiredSubjectId vacío', () => {
    const result = prerequisiteFieldsSchema.safeParse({ ...base, requiredSubjectId: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza un type que no está en el enum', () => {
    const result = prerequisiteFieldsSchema.safeParse({ ...base, type: 'Correlativa' });
    expect(result.success).toBe(false);
  });

  it('rechaza type vacío', () => {
    const result = prerequisiteFieldsSchema.safeParse({ ...base, type: '' });
    expect(result.success).toBe(false);
  });
});
