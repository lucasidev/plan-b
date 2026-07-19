import { describe, expect, it } from 'vitest';
import { careerFieldsSchema, planFieldsSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre el refine de slug (formato URL-safe), los
 * límites de longitud que espejan las columnas del aggregate Career del backend (US-061), el colapso
 * de opcionales vacíos a undefined, y el coerce a number + rango de year del alta de plan de estudios.
 */
describe('careerFieldsSchema', () => {
  const base = { name: 'Ingeniería en Sistemas', slug: 'ing-sistemas' };

  it('acepta un input mínimo válido', () => {
    const result = careerFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  describe('name', () => {
    it('rechaza nombre vacío (solo espacios)', () => {
      const result = careerFieldsSchema.safeParse({ ...base, name: '   ' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es obligatorio.');
      }
    });

    it('rechaza nombre de más de 200 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, name: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('acepta nombre de exactamente 200 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, name: 'a'.repeat(200) });
      expect(result.success).toBe(true);
    });

    it('recorta espacios al inicio/final', () => {
      const result = careerFieldsSchema.safeParse({ ...base, name: '  Ingeniería en Sistemas  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Ingeniería en Sistemas');
      }
    });
  });

  describe('slug', () => {
    it('rechaza slug con mayúsculas', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'ING-SISTEMAS' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/minúsculas/i);
      }
    });

    it('rechaza slug con espacios', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'ing sistemas' });
      expect(result.success).toBe(false);
    });

    it('rechaza slug con guion bajo', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'ing_sistemas' });
      expect(result.success).toBe(false);
    });

    it('rechaza slug que empieza o termina con guion', () => {
      expect(careerFieldsSchema.safeParse({ ...base, slug: '-ing-sistemas' }).success).toBe(false);
      expect(careerFieldsSchema.safeParse({ ...base, slug: 'ing-sistemas-' }).success).toBe(false);
    });

    it('acepta slug con guiones y números', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'ing-sistemas-2' });
      expect(result.success).toBe(true);
    });

    it('rechaza slug de más de 120 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'a'.repeat(121) });
      expect(result.success).toBe(false);
    });

    it('acepta slug de exactamente 120 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, slug: 'a'.repeat(120) });
      expect(result.success).toBe(true);
    });
  });

  describe('shortName', () => {
    it('vacío se colapsa a undefined', () => {
      const result = careerFieldsSchema.safeParse({ ...base, shortName: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shortName).toBeUndefined();
      }
    });

    it('rechaza nombre corto de más de 100 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, shortName: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('code', () => {
    it('acepta código de exactamente 40 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, code: 'a'.repeat(40) });
      expect(result.success).toBe(true);
    });

    it('rechaza código de más de 40 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, code: 'a'.repeat(41) });
      expect(result.success).toBe(false);
    });
  });

  describe('degreeType', () => {
    it('acepta Grado', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: 'Grado' });
      expect(result.success).toBe(true);
    });

    it('acepta Posgrado', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: 'Posgrado' });
      expect(result.success).toBe(true);
    });

    it('acepta Tecnicatura', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: 'Tecnicatura' });
      expect(result.success).toBe(true);
    });

    it('rechaza un valor que no está en el enum', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: 'Doctorado' });
      expect(result.success).toBe(false);
    });

    it('rechaza cualquier basura', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: 'no-existe' });
      expect(result.success).toBe(false);
    });

    it('vacío se colapsa a undefined', () => {
      const result = careerFieldsSchema.safeParse({ ...base, degreeType: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.degreeType).toBeUndefined();
      }
    });
  });

  describe('durationYears', () => {
    it('coerciona el string a number', () => {
      const result = careerFieldsSchema.safeParse({ ...base, durationYears: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.durationYears).toBe(5);
      }
    });

    it('rechaza 0 (mínimo 1 año)', () => {
      const result = careerFieldsSchema.safeParse({ ...base, durationYears: '0' });
      expect(result.success).toBe(false);
    });

    it('rechaza 16 (máximo 15 años)', () => {
      const result = careerFieldsSchema.safeParse({ ...base, durationYears: '16' });
      expect(result.success).toBe(false);
    });

    it('rechaza un valor no entero', () => {
      const result = careerFieldsSchema.safeParse({ ...base, durationYears: '3.5' });
      expect(result.success).toBe(false);
    });

    it('vacío se colapsa a undefined', () => {
      const result = careerFieldsSchema.safeParse({ ...base, durationYears: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.durationYears).toBeUndefined();
      }
    });
  });

  describe('cadence', () => {
    it('acepta Anual', () => {
      const result = careerFieldsSchema.safeParse({ ...base, cadence: 'Anual' });
      expect(result.success).toBe(true);
    });

    it('acepta Cuatrimestral', () => {
      const result = careerFieldsSchema.safeParse({ ...base, cadence: 'Cuatrimestral' });
      expect(result.success).toBe(true);
    });

    it('acepta Semestral', () => {
      const result = careerFieldsSchema.safeParse({ ...base, cadence: 'Semestral' });
      expect(result.success).toBe(true);
    });

    it('rechaza una cadencia que el form no ofrece', () => {
      const result = careerFieldsSchema.safeParse({ ...base, cadence: 'Bimestral' });
      expect(result.success).toBe(false);
    });

    it('vacío se colapsa a undefined', () => {
      const result = careerFieldsSchema.safeParse({ ...base, cadence: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cadence).toBeUndefined();
      }
    });
  });

  describe('description', () => {
    it('acepta descripción de exactamente 500 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, description: 'a'.repeat(500) });
      expect(result.success).toBe(true);
    });

    it('rechaza descripción de más de 500 caracteres', () => {
      const result = careerFieldsSchema.safeParse({ ...base, description: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });
});

describe('planFieldsSchema', () => {
  it('acepta un año como string y lo coerciona a number', () => {
    const result = planFieldsSchema.safeParse({ year: '2023' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2023);
    }
  });

  it('rechaza un año anterior a 1950', () => {
    const result = planFieldsSchema.safeParse({ year: '1949' });
    expect(result.success).toBe(false);
  });

  it('rechaza un año futuro', () => {
    const futureYear = new Date().getFullYear() + 1;
    const result = planFieldsSchema.safeParse({ year: String(futureYear) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/no puede ser de un año futuro/i);
    }
  });

  it('rechaza un año no entero', () => {
    const result = planFieldsSchema.safeParse({ year: '2023.5' });
    expect(result.success).toBe(false);
  });

  describe('label', () => {
    it('vacío se colapsa a undefined', () => {
      const result = planFieldsSchema.safeParse({ year: '2023', label: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.label).toBeUndefined();
      }
    });

    it('acepta label de exactamente 60 caracteres', () => {
      const result = planFieldsSchema.safeParse({ year: '2023', label: 'a'.repeat(60) });
      expect(result.success).toBe(true);
    });

    it('rechaza label de más de 60 caracteres', () => {
      const result = planFieldsSchema.safeParse({ year: '2023', label: 'a'.repeat(61) });
      expect(result.success).toBe(false);
    });
  });
});
