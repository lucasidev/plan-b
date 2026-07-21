import { describe, expect, it } from 'vitest';
import { termFieldsSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre los rangos que espejan el aggregate
 * AcademicTerm del backend (US-064): year 1..añoActual+20, number 1-6, el formato "YYYY-MM-DD" /
 * "YYYY-MM-DDTHH:mm" de los inputs date/datetime-local, y las 3 reglas cross-field (anual siempre
 * número 1, endDate posterior a startDate, enrollmentCloses posterior a enrollmentOpens).
 */
describe('termFieldsSchema', () => {
  const base = {
    year: '2026',
    number: '1',
    kind: 'FourMonth',
    startDate: '2026-03-01',
    endDate: '2026-07-01',
    enrollmentOpens: '2026-02-01T00:00',
    enrollmentCloses: '2026-02-20T00:00',
  };

  it('acepta un input mínimo válido', () => {
    const result = termFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  describe('year', () => {
    it('coerciona el string a number', () => {
      const result = termFieldsSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2026);
      }
    });

    it('rechaza year 0', () => {
      const result = termFieldsSchema.safeParse({ ...base, year: '0' });
      expect(result.success).toBe(false);
    });

    it('rechaza year negativo', () => {
      const result = termFieldsSchema.safeParse({ ...base, year: '-1' });
      expect(result.success).toBe(false);
    });

    it('rechaza year no entero', () => {
      const result = termFieldsSchema.safeParse({ ...base, year: '2026.5' });
      expect(result.success).toBe(false);
    });

    it('acepta year en el límite superior (añoActual + 20)', () => {
      const limitYear = new Date().getFullYear() + 20;
      const result = termFieldsSchema.safeParse({ ...base, year: String(limitYear) });
      expect(result.success).toBe(true);
    });

    it('rechaza year más allá del límite superior (añoActual + 21)', () => {
      const tooFar = new Date().getFullYear() + 21;
      const result = termFieldsSchema.safeParse({ ...base, year: String(tooFar) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/no puede ser tan lejano/i);
      }
    });
  });

  describe('number', () => {
    it('acepta el mínimo (1)', () => {
      const result = termFieldsSchema.safeParse({ ...base, number: '1' });
      expect(result.success).toBe(true);
    });

    it('acepta el máximo (6) con una cadencia que no sea anual', () => {
      const result = termFieldsSchema.safeParse({ ...base, number: '6' });
      expect(result.success).toBe(true);
    });

    it('rechaza 0', () => {
      const result = termFieldsSchema.safeParse({ ...base, number: '0' });
      expect(result.success).toBe(false);
    });

    it('rechaza 7', () => {
      const result = termFieldsSchema.safeParse({ ...base, number: '7' });
      expect(result.success).toBe(false);
    });

    it('rechaza un valor no entero', () => {
      const result = termFieldsSchema.safeParse({ ...base, number: '1.5' });
      expect(result.success).toBe(false);
    });
  });

  describe('kind', () => {
    it('acepta Bimestral', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'TwoMonth' });
      expect(result.success).toBe(true);
    });

    it('acepta Cuatrimestral', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'FourMonth' });
      expect(result.success).toBe(true);
    });

    it('acepta Semestral', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'SixMonth' });
      expect(result.success).toBe(true);
    });

    it('acepta Anual con number 1', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'FullYear', number: '1' });
      expect(result.success).toBe(true);
    });

    it('rechaza un valor que no está en el enum', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'Trimestral' });
      expect(result.success).toBe(false);
    });

    it('rechaza vacío', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('cross-field: anual siempre es número 1', () => {
    it('rechaza Anual con number distinto de 1', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'FullYear', number: '2' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/anual.*siempre.*número 1/i);
      }
    });

    it('acepta una cadencia no anual con number distinto de 1', () => {
      const result = termFieldsSchema.safeParse({ ...base, kind: 'FourMonth', number: '2' });
      expect(result.success).toBe(true);
    });
  });

  describe('startDate / endDate', () => {
    it('rechaza un formato inválido de startDate', () => {
      const result = termFieldsSchema.safeParse({ ...base, startDate: '01/03/2026' });
      expect(result.success).toBe(false);
    });

    it('rechaza un formato inválido de endDate', () => {
      const result = termFieldsSchema.safeParse({ ...base, endDate: '2026/07/01' });
      expect(result.success).toBe(false);
    });

    it('rechaza endDate igual a startDate', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        startDate: '2026-03-01',
        endDate: '2026-03-01',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza endDate anterior a startDate', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        startDate: '2026-07-01',
        endDate: '2026-03-01',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/posterior a la de inicio/i);
      }
    });

    it('acepta endDate posterior a startDate', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        startDate: '2026-03-01',
        endDate: '2026-07-01',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('enrollmentOpens / enrollmentCloses', () => {
    it('rechaza un formato inválido de enrollmentOpens', () => {
      const result = termFieldsSchema.safeParse({ ...base, enrollmentOpens: '2026-02-01' });
      expect(result.success).toBe(false);
    });

    it('acepta un formato con segundos', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        enrollmentOpens: '2026-02-01T00:00:00',
        enrollmentCloses: '2026-02-20T00:00:00',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza enrollmentCloses igual a enrollmentOpens', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        enrollmentOpens: '2026-02-01T00:00',
        enrollmentCloses: '2026-02-01T00:00',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza enrollmentCloses anterior a enrollmentOpens', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        enrollmentOpens: '2026-02-20T00:00',
        enrollmentCloses: '2026-02-01T00:00',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/posterior a la apertura/i);
      }
    });

    it('acepta enrollmentCloses posterior a enrollmentOpens', () => {
      const result = termFieldsSchema.safeParse({
        ...base,
        enrollmentOpens: '2026-02-01T00:00',
        enrollmentCloses: '2026-02-20T00:00',
      });
      expect(result.success).toBe(true);
    });
  });
});
