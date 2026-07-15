import { describe, expect, it } from 'vitest';
import { universityFieldsSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre los refines de slug (formato URL-safe) y
 * de dominios institucionales (formato de dominio), más los límites de longitud que espejan las
 * columnas del aggregate University del backend (US-060).
 */
describe('universityFieldsSchema', () => {
  const base = { name: 'UNSTA', slug: 'unsta', institutionalEmailDomains: [] as string[] };

  it('acepta un input mínimo válido sin dominios', () => {
    const result = universityFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  describe('name', () => {
    it('rechaza nombre vacío (solo espacios)', () => {
      const result = universityFieldsSchema.safeParse({ ...base, name: '   ' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es obligatorio.');
      }
    });

    it('rechaza nombre de más de 200 caracteres', () => {
      const result = universityFieldsSchema.safeParse({ ...base, name: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('acepta nombre de exactamente 200 caracteres', () => {
      const result = universityFieldsSchema.safeParse({ ...base, name: 'a'.repeat(200) });
      expect(result.success).toBe(true);
    });

    it('recorta espacios al inicio/final', () => {
      const result = universityFieldsSchema.safeParse({ ...base, name: '  UNSTA  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('UNSTA');
      }
    });
  });

  describe('slug', () => {
    it('rechaza slug vacío', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: '' });
      expect(result.success).toBe(false);
    });

    it('rechaza slug con mayúsculas', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'UNSTA' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/minúsculas/i);
      }
    });

    it('rechaza slug con espacios', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'utn frba' });
      expect(result.success).toBe(false);
    });

    it('rechaza slug con guion bajo', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'utn_frba' });
      expect(result.success).toBe(false);
    });

    it('rechaza slug que empieza o termina con guion', () => {
      expect(universityFieldsSchema.safeParse({ ...base, slug: '-unsta' }).success).toBe(false);
      expect(universityFieldsSchema.safeParse({ ...base, slug: 'unsta-' }).success).toBe(false);
    });

    it('acepta slug con guiones y números', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'utn-frba-2' });
      expect(result.success).toBe(true);
    });

    it('rechaza slug de más de 100 caracteres', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('acepta slug de exactamente 100 caracteres', () => {
      const result = universityFieldsSchema.safeParse({ ...base, slug: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });
  });

  describe('institutionalEmailDomains', () => {
    it('acepta lista vacía', () => {
      const result = universityFieldsSchema.safeParse({ ...base, institutionalEmailDomains: [] });
      expect(result.success).toBe(true);
    });

    it('acepta un dominio válido', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: ['unsta.edu.ar'],
      });
      expect(result.success).toBe(true);
    });

    it('acepta mayúsculas en el dominio (formato case-insensitive; el backend normaliza)', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: ['UNSTA.edu.ar'],
      });
      expect(result.success).toBe(true);
    });

    it('rechaza un dominio sin punto', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: ['unsta'],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza un dominio con espacios', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: ['unsta edu.ar'],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza un dominio de más de 255 caracteres', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: [`${'a'.repeat(253)}.ar`],
      });
      expect(result.success).toBe(false);
    });

    it('acepta varios dominios válidos', () => {
      const result = universityFieldsSchema.safeParse({
        ...base,
        institutionalEmailDomains: ['unsta.edu.ar', 'alumnos.unsta.edu.ar'],
      });
      expect(result.success).toBe(true);
    });

    it('usa lista vacía por default cuando no se manda el campo', () => {
      const result = universityFieldsSchema.safeParse({ name: 'UNSTA', slug: 'unsta' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.institutionalEmailDomains).toEqual([]);
      }
    });
  });
});
