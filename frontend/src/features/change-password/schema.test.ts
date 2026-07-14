import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from './schema';

/**
 * Schema tests (tier "Utils / Schemas", ADR-0036). Cubre los dos refines cross-field del
 * PATCH /api/me/password (US-079-i): confirmación coincidente y "nueva distinta a la actual".
 */
describe('changePasswordSchema', () => {
  it('acepta un input válido', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'contrasena-actual-1',
      newPassword: 'contrasena-nueva-1',
      confirmPassword: 'contrasena-nueva-1',
    });
    expect(result.success).toBe(true);
  });

  describe('refine: newPassword === confirmPassword', () => {
    it('rechaza cuando no coinciden, con el error en confirmPassword', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'contrasena-actual-1',
        newPassword: 'contrasena-nueva-1',
        confirmPassword: 'otra-distinta-1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(issue?.message).toBe('Las contraseñas no coinciden');
      }
    });
  });

  describe('refine: currentPassword !== newPassword', () => {
    it('rechaza cuando la nueva es igual a la actual, con el error en newPassword', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'misma-contrasena-1',
        newPassword: 'misma-contrasena-1',
        confirmPassword: 'misma-contrasena-1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPassword'));
        expect(issue?.message).toBe('La nueva contraseña tiene que ser distinta a la actual');
      }
    });
  });
});
