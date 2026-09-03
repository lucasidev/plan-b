import { describe, expect, it } from 'vitest';
import { courseReviewSchema } from './schema';

/**
 * Reglas de `courseReviewSchema` (US-146, ADR-0082) desde sus mensajes exportados: qué es
 * obligatorio, que `answers` no puede quedar vacío, el tope de `freeText` y que la cátedra
 * admite `null`.
 */

const VALID_PAYLOAD = {
  subjectId: '11111111-1111-1111-1111-111111111111',
  termId: '22222222-2222-2222-2222-222222222222',
  chairId: null,
  answers: { 'kept-pace': 1 },
  freeText: null,
};

describe('courseReviewSchema', () => {
  it('acepta un payload completo con chairId nulo y sin texto libre', () => {
    const result = courseReviewSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('exige subjectId con el mensaje "Elegí la materia que cursaste."', () => {
    const result = courseReviewSchema.safeParse({ ...VALID_PAYLOAD, subjectId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Elegí la materia que cursaste.');
    }
  });

  it('exige termId con el mensaje "Elegí cuándo la cursaste."', () => {
    const result = courseReviewSchema.safeParse({ ...VALID_PAYLOAD, termId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Elegí cuándo la cursaste.');
    }
  });

  it('permite chairId nulo', () => {
    const result = courseReviewSchema.safeParse({ ...VALID_PAYLOAD, chairId: null });
    expect(result.success).toBe(true);
  });

  it('rechaza answers vacío con el mensaje "Contestá al menos una pregunta."', () => {
    const result = courseReviewSchema.safeParse({ ...VALID_PAYLOAD, answers: {} });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Contestá al menos una pregunta.');
    }
  });

  it('acepta freeText de exactamente 2000 caracteres', () => {
    const result = courseReviewSchema.safeParse({
      ...VALID_PAYLOAD,
      freeText: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('rechaza freeText de 2001 caracteres con el mensaje "El texto es demasiado largo."', () => {
    const result = courseReviewSchema.safeParse({
      ...VALID_PAYLOAD,
      freeText: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('El texto es demasiado largo.');
    }
  });
});
