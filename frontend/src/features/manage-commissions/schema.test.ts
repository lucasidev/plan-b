import { describe, expect, it } from 'vitest';
import { commissionFieldsSchema, commissionScheduleBlockSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre los campos propios (nombre, modalidad, cupo
 * opcional, notas opcionales) y cada bloque de horario (día + "HH:mm" válidos, fin posterior al
 * inicio). No cubre invariantes cross-entidad (docente duplicado, doble titular, solape entre
 * bloques): esos son 409 del aggregate, no reglas de este schema (ver comentario de schema.ts).
 */
describe('commissionFieldsSchema', () => {
  const base = {
    name: 'A',
    modality: 'Presencial',
    capacity: '',
    notes: '',
    teachers: [],
    schedule: [],
  };

  it('acepta el mínimo válido (sin docentes ni horario)', () => {
    const result = commissionFieldsSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.teachers).toEqual([]);
      expect(result.data.schedule).toEqual([]);
    }
  });

  describe('name', () => {
    it('rechaza vacío', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, name: '' });
      expect(result.success).toBe(false);
    });

    it('rechaza solo espacios', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, name: '   ' });
      expect(result.success).toBe(false);
    });

    it('rechaza más de 100 caracteres', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('acepta exactamente 100 caracteres', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, name: 'A'.repeat(100) });
      expect(result.success).toBe(true);
    });
  });

  describe('modality', () => {
    it.each(['Presencial', 'Virtual', 'Hibrida'])('acepta %s', (modality) => {
      const result = commissionFieldsSchema.safeParse({ ...base, modality });
      expect(result.success).toBe(true);
    });

    it('rechaza un valor fuera del enum', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, modality: 'Semipresencial' });
      expect(result.success).toBe(false);
    });

    it('rechaza vacío', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, modality: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('capacity', () => {
    it('acepta vacío (opcional, colapsa a undefined)', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, capacity: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBeUndefined();
      }
    });

    it('coerciona el string a number', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, capacity: '40' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBe(40);
      }
    });

    it('rechaza 0', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, capacity: '0' });
      expect(result.success).toBe(false);
    });

    it('rechaza negativo', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, capacity: '-5' });
      expect(result.success).toBe(false);
    });

    it('rechaza un valor no entero', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, capacity: '40.5' });
      expect(result.success).toBe(false);
    });
  });

  describe('notes', () => {
    it('acepta vacío (opcional, colapsa a undefined)', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, notes: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('acepta hasta 2000 caracteres', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, notes: 'x'.repeat(2000) });
      expect(result.success).toBe(true);
    });

    it('rechaza más de 2000 caracteres', () => {
      const result = commissionFieldsSchema.safeParse({ ...base, notes: 'x'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('teachers', () => {
    it('acepta un docente válido', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        teachers: [{ teacherId: '00000000-0000-4000-a000-000000000001', role: 'Lead' }],
      });
      expect(result.success).toBe(true);
    });

    it('rechaza un teacherId que no es uuid', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        teachers: [{ teacherId: 'no-es-un-uuid', role: 'Lead' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza un rol fuera del enum', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        teachers: [{ teacherId: '00000000-0000-4000-a000-000000000001', role: 'Decano' }],
      });
      expect(result.success).toBe(false);
    });

    it('acepta varios docentes', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        teachers: [
          { teacherId: '00000000-0000-4000-a000-000000000001', role: 'Lead' },
          { teacherId: '00000000-0000-4000-a000-000000000002', role: 'Assistant' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('schedule', () => {
    it('acepta un bloque válido', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '14:00', end: '16:00' }],
      });
      expect(result.success).toBe(true);
    });

    it('rechaza un día fuera del enum', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Funday', start: '14:00', end: '16:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza un horario de inicio con formato inválido', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '2pm', end: '16:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza un horario de fin con formato inválido', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '14:00', end: '16:00:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza 24:00 (fuera de rango horario)', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '14:00', end: '24:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza end igual a start', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '14:00', end: '14:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('rechaza end anterior a start', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [{ day: 'Monday', start: '16:00', end: '14:00' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/posterior al de inicio/i);
      }
    });

    it('acepta varios bloques, cada uno validado de forma independiente', () => {
      const result = commissionFieldsSchema.safeParse({
        ...base,
        schedule: [
          { day: 'Monday', start: '14:00', end: '16:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('commissionScheduleBlockSchema', () => {
  it('acepta un bloque suelto válido', () => {
    const result = commissionScheduleBlockSchema.safeParse({
      day: 'Friday',
      start: '09:00',
      end: '12:00',
    });
    expect(result.success).toBe(true);
  });
});
