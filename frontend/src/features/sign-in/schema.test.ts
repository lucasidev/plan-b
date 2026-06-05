import { describe, expect, it } from 'vitest';
import { signInSchema } from './schema';

/**
 * Sample test for the "Schemas" tier of the pyramid (ADR-0036). Zod schemas are pure
 * data validators: testable without DOM or network, the fastest feedback loop tier.
 */
describe('signInSchema', () => {
  it('acepta un input válido', () => {
    const result = signInSchema.safeParse({
      email: 'lucia@unsta.edu.ar',
      password: 'una-contrase-segura',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza email vacío con mensaje "Ingresá tu email"', () => {
    const result = signInSchema.safeParse({ email: '', password: 'una-contrase-segura' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Ingresá tu email')).toBe(true);
    }
  });

  it('rechaza email mal formado', () => {
    const result = signInSchema.safeParse({
      email: 'no-es-email',
      password: 'una-contrase-segura',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === 'Ingresá un email válido')).toBe(true);
    }
  });

  it('rechaza password con menos de 12 caracteres', () => {
    const result = signInSchema.safeParse({ email: 'lucia@test.com', password: 'corta-11ch' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('La contraseña tiene que tener al menos 12 caracteres'),
        ),
      ).toBe(true);
    }
  });

  it('infiere SignInInput correctamente del schema', () => {
    // Type-level test: if this compiles, the type is sound. No runtime assertion.
    const valid = { email: 'lucia@test.com', password: 'doce-chars-12' };
    const parsed = signInSchema.parse(valid);
    expect(parsed.email).toBe('lucia@test.com');
    expect(parsed.password).toBe('doce-chars-12');
  });
});
