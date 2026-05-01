import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signInAction } from './actions';
import { initialSignInState } from './types';

/**
 * Sample tests para la rama "Server Actions" de la pirámide (ADR-0036).
 * El action es lógica pura mockeable en sus deps externas:
 *   - `./api`              → controlamos el Response del backend.
 *   - `next/navigation`    → capturamos el redirect sin navegar.
 *   - `@/lib/forward-set-cookies` → no-op; testeamos el flow del action,
 *     no el parseo de cookies (esa lógica tiene su propio módulo).
 *
 * Cubrimos las 5 ramas que el action expone vía SignInFormState.kind:
 *   - input inválido (Zod) → invalid_credentials con mensaje del schema
 *   - 200                  → redirect a /home (NEXT_REDIRECT)
 *   - 401                  → invalid_credentials
 *   - 403 + email_not_verified → email_not_verified
 *   - 403 + account_disabled   → account_disabled
 *   - 500 / otros          → unknown
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
  it('devuelve invalid_credentials cuando Zod rechaza el input', async () => {
    const result = await signInAction(
      initialSignInState,
      formData({ email: '', password: 'una-contrase-segura' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('invalid_credentials');
      // El primer issue de Zod es el de email vacío.
      expect(result.message).toMatch(/email/i);
    }
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('redirecciona a /home cuando el backend responde 200', async () => {
    signInMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(
      signInAction(
        initialSignInState,
        formData({ email: 'lucia@test.com', password: 'doce-chars-1' }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/home/);

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
      expect(result.message).toBe('Email o contraseña incorrectos');
    }
  });

  it('mapea 403 con title=email_not_verified al kind correspondiente', async () => {
    const body = { title: 'identity.account.email_not_verified', detail: 'whatever' };
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
      expect(result.kind).toBe('email_not_verified');
      expect(result.message).toMatch(/verificada/i);
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
      // detail del backend filtra al UI cuando no matcheamos un kind conocido.
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
