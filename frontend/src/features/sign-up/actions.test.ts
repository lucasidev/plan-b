import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signUpAction } from './actions';
import { initialSignUpState } from './types';

/**
 * Tests del server action `signUpAction` (US-010-f + ADR-0086: la carrera se declara en el
 * propio registro, no en el onboarding). Mockeamos `./api` para controlar la Response del
 * backend sin pegarle a nada real.
 *
 * No hace falta mockear `next/navigation`: el action es una mutación pura (ADR-0046), nunca
 * llama `redirect()`, devuelve `{status, redirectTo}` y navega el cliente.
 *
 * Foco: el plan de estudios faltante (Zod), el 400
 * `identity.registration.career_plan_not_found` mapeado al campo `careerPlanId`, el éxito
 * con su `redirectTo`, y (US-229) que un `from` sano viaje a check-inbox y quede en la cookie
 * que `/verify-email` va a leer más tarde.
 */

vi.mock('./api', () => ({
  registerUser: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { registerUser } from './api';

const registerUserMock = vi.mocked(registerUser);
const cookiesMock = vi.mocked(cookies);

function fakeCookieStore() {
  const set = vi.fn();
  // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
  return { set } as any;
}

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

const VALID_INPUT = {
  email: 'lucia@test.com',
  password: 'doce-caracteres-ok',
  confirm: 'doce-caracteres-ok',
  careerPlanId: '33333333-3333-4333-a333-333333333333',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signUpAction', () => {
  it('devuelve error en el campo careerPlanId cuando falta el plan, sin llamar al backend', async () => {
    const result = await signUpAction(
      initialSignUpState,
      formData({ ...VALID_INPUT, careerPlanId: '' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.field).toBe('careerPlanId');
      expect(result.message).toBe('Elegí tu carrera');
    }
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  it('202 devuelve /sign-up/check-inbox con el email como destino', async () => {
    registerUserMock.mockResolvedValue(new Response(null, { status: 202 }));

    await expect(signUpAction(initialSignUpState, formData(VALID_INPUT))).resolves.toEqual({
      status: 'success',
      redirectTo: `/sign-up/check-inbox?email=${encodeURIComponent(VALID_INPUT.email)}`,
    });

    expect(registerUserMock).toHaveBeenCalledWith({
      email: VALID_INPUT.email,
      password: VALID_INPUT.password,
      careerPlanId: VALID_INPUT.careerPlanId,
    });
  });

  it('US-229: un from sano viaja a check-inbox y queda guardado para /verify-email', async () => {
    registerUserMock.mockResolvedValue(new Response(null, { status: 202 }));
    const store = fakeCookieStore();
    cookiesMock.mockResolvedValue(store);

    await expect(
      signUpAction(initialSignUpState, formData({ ...VALID_INPUT, from: '/reviews/new' })),
    ).resolves.toEqual({
      status: 'success',
      redirectTo: `/sign-up/check-inbox?email=${encodeURIComponent(VALID_INPUT.email)}&from=%2Freviews%2Fnew`,
    });

    expect(store.set).toHaveBeenCalledWith(
      'planb_from',
      '/reviews/new',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('US-229: un from que apunta afuera del producto no viaja ni se guarda (cuidado con lo obvio)', async () => {
    registerUserMock.mockResolvedValue(new Response(null, { status: 202 }));
    const store = fakeCookieStore();
    cookiesMock.mockResolvedValue(store);

    await expect(
      signUpAction(
        initialSignUpState,
        formData({ ...VALID_INPUT, from: 'https://evil.com/phish' }),
      ),
    ).resolves.toEqual({
      status: 'success',
      redirectTo: `/sign-up/check-inbox?email=${encodeURIComponent(VALID_INPUT.email)}`,
    });

    expect(store.set).not.toHaveBeenCalled();
  });

  it('400 con code career_plan_not_found aterriza en el campo careerPlanId', async () => {
    // El handler lo devuelve como Result<T>.Failure (Error.Validation), así que el endpoint
    // lo serializa como ProblemDetails plano (title + detail), no como el diccionario
    // `errors` que arma FluentValidation para errores de shape del command.
    registerUserMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'identity.registration.career_plan_not_found',
          detail:
            'Career plan referenced by the registration was not found in the academic catalog.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await signUpAction(initialSignUpState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.field).toBe('careerPlanId');
      expect(result.message).toBe('No encontramos ese plan de estudios. Volvé a elegirlo.');
    }
  });
});
