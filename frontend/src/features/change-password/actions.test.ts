import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePasswordAction } from './actions';
import { initialChangePasswordState } from './types';

/**
 * Tests del server action `changePasswordAction` (US-079-i). Mocks de borde:
 *   - `next/headers`   → cookie store fake con delete trackeable.
 *   - `next/navigation` → redirect que tira NEXT_REDIRECT atrapable.
 *   - `@/lib/session`   → fake de getSession para simular session OK / null.
 *   - `./api`           → controla la Response que recibe el action.
 *
 * Cubrimos: sin sesión, validación Zod, network failure, 204 (limpia cookies + redirect),
 * 401, cada mapeo de title en 400 (same_as_current / too_weak / too_long / fallback), y
 * el catch-all 5xx.
 */

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  }),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('./api', () => ({
  changePassword: vi.fn(),
}));

import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { changePassword } from './api';

const cookiesMock = vi.mocked(cookies);
const getSessionMock = vi.mocked(getSession);
const changePasswordMock = vi.mocked(changePassword);

function fakeCookieStore() {
  const deleted: string[] = [];
  const store = {
    get: vi.fn(() => undefined),
    delete: vi.fn((name: string) => {
      deleted.push(name);
    }),
  };
  return { store, deleted };
}

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

const VALID_INPUT = {
  currentPassword: 'contrasena-actual-1',
  newPassword: 'contrasena-nueva-1',
  confirmPassword: 'contrasena-nueva-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'lucia@unsta.edu.ar',
    role: 'member',
  });
});

describe('changePasswordAction', () => {
  it('devuelve error unknown cuando no hay sesión', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('devuelve error validation cuando Zod rechaza el input', async () => {
    const result = await changePasswordAction(
      initialChangePasswordState,
      formData({ ...VALID_INPUT, confirmPassword: 'otra-distinta-1' }),
    );

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('validation');
      expect(result.message).toBe('Las contraseñas no coinciden');
    }
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('devuelve error unknown cuando falla la conexión', async () => {
    changePasswordMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
  });

  it('204 borra cookies y redirige a /sign-in?password-changed=1', async () => {
    const { store, deleted } = fakeCookieStore();
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    changePasswordMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      changePasswordAction(initialChangePasswordState, formData(VALID_INPUT)),
    ).rejects.toThrow(/NEXT_REDIRECT:\/sign-in\?password-changed=1/);

    expect(deleted).toContain('planb_session');
    expect(deleted).toContain('planb_refresh');
  });

  it('401 mapea a kind wrong_current', async () => {
    changePasswordMock.mockResolvedValue(new Response(null, { status: 401 }));

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('wrong_current');
      expect(result.message).toMatch(/no es correcta/i);
    }
  });

  it('400 con title same_as_current mapea a kind same_as_current', async () => {
    changePasswordMock.mockResolvedValue(
      new Response(JSON.stringify({ title: 'identity.password.same_as_current' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('same_as_current');
    }
  });

  it('400 con title too_weak mapea a kind too_weak', async () => {
    changePasswordMock.mockResolvedValue(
      new Response(JSON.stringify({ title: 'identity.password.too_weak' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('too_weak');
    }
  });

  it('400 con title too_long mapea a kind too_long', async () => {
    changePasswordMock.mockResolvedValue(
      new Response(JSON.stringify({ title: 'identity.password.too_long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('too_long');
    }
  });

  it('400 con title desconocido cae a validation usando el detail', async () => {
    changePasswordMock.mockResolvedValue(
      new Response(JSON.stringify({ title: 'identity.password.something_new', detail: 'raro' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('validation');
      expect(result.message).toBe('raro');
    }
  });

  it('cae a unknown cuando el backend devuelve 500', async () => {
    changePasswordMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await changePasswordAction(initialChangePasswordState, formData(VALID_INPUT));

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.kind).toBe('unknown');
    }
  });
});
