import { describe, expect, it } from 'vitest';
import { signInSchema } from './schema';

/**
 * Sample test para la rama "Schemas" de la pirámide (ADR-0036).
 * Zod schemas son data validators puros: testeables sin DOM ni network,
 * la base más rápida del feedback loop.
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
    // Type-level test: si esto compila, el tipo está sano. No assert en runtime.
    const valid = { email: 'lucia@test.com', password: 'doce-chars-12' };
    const parsed = signInSchema.parse(valid);
    expect(parsed.email).toBe('lucia@test.com');
    expect(parsed.password).toBe('doce-chars-12');
  });
});
