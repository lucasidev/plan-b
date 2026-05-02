import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resendVerificationAction } from './actions';
import { initialResendVerificationState } from './types';

/**
 * Tests para la rama "Server Actions" de la pirámide (ADR-0036).
 *
 * Cubre las 4 ramas que el action expone vía ResendVerificationFormState:
 *   - input inválido (Zod) → error.kind=validation
 *   - 204                  → status=sent
 *   - 429                  → error.kind=rate_limit
 *   - 5xx / otros          → error.kind=unknown
 */

vi.mock('./api', () => ({
  resendVerification: vi.fn(),
}));

import { resendVerification } from './api';

describe('resendVerificationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildFormData(email: string) {
    const fd = new FormData();
    fd.set('email', email);
    return fd;
  }

  it('retorna error de validación cuando el email es vacio', async () => {
    const result = await resendVerificationAction(
      initialResendVerificationState,
      buildFormData(''),
    );

    expect(result).toMatchObject({
      status: 'error',
      kind: 'validation',
    });
    expect(result.status === 'error' && result.message).toMatch(/necesitamos tu email/i);
    expect(resendVerification).not.toHaveBeenCalled();
  });

  it('retorna error de validación cuando el email es malformado', async () => {
    const result = await resendVerificationAction(
      initialResendVerificationState,
      buildFormData('not-an-email'),
    );

    expect(result).toMatchObject({
      status: 'error',
      kind: 'validation',
    });
    expect(result.status === 'error' && result.message).toMatch(/inválido/i);
    expect(resendVerification).not.toHaveBeenCalled();
  });

  it('setea status sent cuando el backend responde 204', async () => {
    vi.mocked(resendVerification).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await resendVerificationAction(
      initialResendVerificationState,
      buildFormData('lucia@test.com'),
    );

    expect(result).toEqual({ status: 'sent' });
    expect(resendVerification).toHaveBeenCalledWith({ email: 'lucia@test.com' });
  });

  it('retorna error de rate_limit cuando el backend responde 429', async () => {
    vi.mocked(resendVerification).mockResolvedValue(new Response(null, { status: 429 }));

    const result = await resendVerificationAction(
      initialResendVerificationState,
      buildFormData('lucia@test.com'),
    );

    expect(result).toMatchObject({
      status: 'error',
      kind: 'rate_limit',
    });
    expect(result.status === 'error' && result.message).toMatch(/esperá unos minutos/i);
  });

  it('retorna error de unknown para 5xx u otros', async () => {
    vi.mocked(resendVerification).mockResolvedValue(new Response(null, { status: 500 }));

    const result = await resendVerificationAction(
      initialResendVerificationState,
      buildFormData('lucia@test.com'),
    );

    expect(result).toMatchObject({
      status: 'error',
      kind: 'unknown',
    });
  });
});
