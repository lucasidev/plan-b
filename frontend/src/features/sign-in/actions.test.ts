import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInAction } from './actions';
import { initialSignInState } from './types';

/**
 * Sample tests for the "Server Actions" tier of the pyramid (ADR-0036). The action is
 * pure logic and its external deps are mockable:
 *   - `./api`              -> we control the backend Response.
 *   - `next/navigation`    -> we capture the redirect without navigating.
 *   - `@/lib/forward-set-cookies` -> no-op; we test the action flow, not the cookie
 *     parsing (that has its own module).
 *
 * We cover the branches the action exposes through SignInFormState.kind:
 *   - invalid input (Zod) -> unknown with the schema's message
 *   - 200                 -> redirect to /home (NEXT_REDIRECT)
 *   - 401                 -> invalid_credentials (con email, para el reenvío; ADR-0076)
 *   - 403 + account_disabled   -> account_disabled
 *   - 500 / others        -> unknown
 */

vi.mock('./api', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    // Next's redirect throws NEXT_REDIRECT internally. Reproducimos sin
    // toda la maquinaria: tiramos un error que el test puede atrapar.
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock('@/lib/forward-set-cookies', () => ({
  forwardSetCookies: vi.fn(async () => undefined),
}));

import { signIn } from './api';

const signInMock = vi.mocked(signIn);

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInAction', () => {
  it('devuelve unknown cuando Zod rechaza el input', async () => {
    const result = await signInAction(
      initialSignInState,
      formData({ email: '', password: 'una-contrase-segura' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
      // Zod's first issue is the empty-email one.
      expect(result.message).toMatch(/email/i);
    }
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('devuelve /home como destino cuando el backend responde 200', async () => {
    signInMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(
      signInAction(
        initialSignInState,
        formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
      ),
    ).resolves.toEqual({
      status: 'success',
      redirectTo: '/home',
    });

    expect(signInMock).toHaveBeenCalledWith({
      email: 'lucia@test.com',
      password: 'doce-chars-1',
    });
  });

  it('mapea 401 a invalid_credentials con mensaje genérico', async () => {
    signInMock.mockResolvedValue(new Response(null, { status: 401 }));

    const result = await signInAction(
      initialSignInState,
      formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('invalid_credentials');
      expect(result.message).toBe('El mail o la contraseña no coinciden.');
      // ADR-0076: el 401 lleva el email tipeado para poder ofrecer el reenvío de verificación.
      if (result.kind === 'invalid_credentials') {
        expect(result.email).toBe('lucia@test.com');
      }
    }
  });

  it('mapea 403 con title=disabled al kind correspondiente', async () => {
    const body = { title: 'identity.account.disabled', detail: 'whatever' };
    signInMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await signInAction(
      initialSignInState,
      formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('account_disabled');
      expect(result.message).toMatch(/suspendida/i);
    }
  });

  it('cae a unknown cuando 403 trae un title desconocido', async () => {
    const body = { title: 'identity.account.something_new', detail: 'soy nuevo' };
    signInMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await signInAction(
      initialSignInState,
      formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
      // The backend `detail` leaks through to the UI when we do not match a known kind.
      expect(result.message).toBe('soy nuevo');
    }
  });

  it('cae a unknown cuando el backend devuelve 500', async () => {
    signInMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await signInAction(
      initialSignInState,
      formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
    }
  });
});
