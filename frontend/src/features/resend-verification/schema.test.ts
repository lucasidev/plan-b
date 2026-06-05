import { describe, expect, it } from 'vitest';
import { resendVerificationSchema } from './schema';

/**
 * Schema tests (the "Utils / Schemas" tier of the pyramid). The schema is the only
 * client-side validation; the backend accepts any string and responds 204 so it does
 * not leak enumerable info. These tests exist so a schema change cannot silently
 * break the UX.
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
