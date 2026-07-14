import { describe, expect, it } from 'vitest';
import { reviewFormSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre el transform `''` -> `undefined` +
 * el refine condicional del texto (mínimo 50 sólo si hay texto), y los rangos de
 * rating/difficulty/hoursPerWeek (US-049).
 */
describe('reviewFormSchema', () => {
  const base = {
    rating: 4,
    difficulty: 3,
    wouldRecommendCourse: true,
    wouldRetakeTeacher: true,
  };

  it('acepta un input mínimo válido sin texto', () => {
    const result = reviewFormSchema.safeParse({ ...base, text: undefined });
    expect(result.success).toBe(true);
  });

  describe('texto: transform + refine condicional', () => {
    it('texto vacío transforma a undefined y pasa (no dispara el mínimo de 50)', () => {
      const result = reviewFormSchema.safeParse({ ...base, text: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBeUndefined();
      }
    });

    it('rechaza texto de 40 caracteres (por debajo del mínimo de 50)', () => {
      const result = reviewFormSchema.safeParse({ ...base, text: 'a'.repeat(40) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mínimo 50 caracteres');
      }
    });

    it('acepta texto de 50 caracteres', () => {
      const result = reviewFormSchema.safeParse({ ...base, text: 'a'.repeat(50) });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('a'.repeat(50));
      }
    });

    it('rechaza texto de más de 2000 caracteres', () => {
      const result = reviewFormSchema.safeParse({ ...base, text: 'a'.repeat(2001) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === 'Máximo 2000 caracteres')).toBe(true);
      }
    });
  });

  describe('rating', () => {
    it('rechaza rating no entero', () => {
      const result = reviewFormSchema.safeParse({ ...base, rating: 3.5 });
      expect(result.success).toBe(false);
    });

    it('rechaza rating fuera de rango (0 y 6)', () => {
      expect(reviewFormSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
      expect(reviewFormSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    });

    it('acepta rating en los extremos del rango (1 y 5)', () => {
      expect(reviewFormSchema.safeParse({ ...base, rating: 1 }).success).toBe(true);
      expect(reviewFormSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    });
  });

  describe('difficulty', () => {
    it('rechaza difficulty no entero', () => {
      const result = reviewFormSchema.safeParse({ ...base, difficulty: 2.2 });
      expect(result.success).toBe(false);
    });

    it('rechaza difficulty fuera de rango (0 y 6)', () => {
      expect(reviewFormSchema.safeParse({ ...base, difficulty: 0 }).success).toBe(false);
      expect(reviewFormSchema.safeParse({ ...base, difficulty: 6 }).success).toBe(false);
    });

    it('acepta difficulty en los extremos del rango (1 y 5)', () => {
      expect(reviewFormSchema.safeParse({ ...base, difficulty: 1 }).success).toBe(true);
      expect(reviewFormSchema.safeParse({ ...base, difficulty: 5 }).success).toBe(true);
    });
  });

  describe('hoursPerWeek', () => {
    it('acepta hoursPerWeek ausente (optional)', () => {
      const result = reviewFormSchema.safeParse({ ...base });
      expect(result.success).toBe(true);
    });

    it('rechaza hoursPerWeek fuera de rango (-1 y 21)', () => {
      expect(reviewFormSchema.safeParse({ ...base, hoursPerWeek: -1 }).success).toBe(false);
      expect(reviewFormSchema.safeParse({ ...base, hoursPerWeek: 21 }).success).toBe(false);
    });

    it('acepta hoursPerWeek en los extremos del rango (0 y 20)', () => {
      expect(reviewFormSchema.safeParse({ ...base, hoursPerWeek: 0 }).success).toBe(true);
      expect(reviewFormSchema.safeParse({ ...base, hoursPerWeek: 20 }).success).toBe(true);
    });
  });
});
