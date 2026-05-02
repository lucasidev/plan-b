import { describe, expect, it } from 'vitest';
import { resendVerificationSchema } from './schema';

/**
 * Tests del schema (rama "Utils / Schemas" de la pirámide). El schema es la
 * única validación lado-cliente; el backend acepta cualquier string y responde
 * 204 para no filtrar enumerable info. Estos tests existen para evitar que un
 * cambio del schema rompa la UX silenciosamente.
 */
describe('resendVerificationSchema', () => {
  it('acepta un email válido', () => {
    const result = resendVerificationSchema.safeParse({ email: 'lucia@unsta.edu.ar' });
    expect(result.success).toBe(true);
  });

  it('rechaza email vacio con mensaje "necesitamos tu email"', () => {
    const result = resendVerificationSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/necesitamos tu email/i);
    }
  });

  it('rechaza email malformado con mensaje "inválido"', () => {
    const result = resendVerificationSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/inválido/i);
    }
  });
});
