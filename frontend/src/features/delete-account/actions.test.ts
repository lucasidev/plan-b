import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAccountAction } from './actions';
import { initialDeleteAccountState } from './types';

/**
 * Tests del server action `deleteAccountAction` (US-038-f).
 * Mocks de borde:
 *   - `next/headers`          → cookie store fake con get/delete trackeable.
 *   - `next/navigation`       → redirect que tira NEXT_REDIRECT atrapable.
 *   - `@/lib/api-client`      → controla la Response que recibe el action.
 *   - `@/lib/session`         → fake de getSession para simular session OK / null.
 *
 * Cubrimos las cinco ramas del action:
 *   - sin sesión              → error "tu sesión expiró"
 *   - 204                     → cookies borradas + redirect a /sign-in?deleted=1
 *   - 404 idempotent          → cookies borradas + redirect a /sign-in?deleted=1
 *   - 401                     → error "tu sesión expiró"
 *   - 5xx / network failure   → error genérico, cookies NO se borran
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

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}));

import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';

const cookiesMock = vi.mocked(cookies);
const apiFetchMock = vi.mocked(apiFetch);
const getSessionMock = vi.mocked(getSession);

function fakeCookieStore(refreshValue?: string) {
  const deleted: string[] = [];
  const store = {
    get: vi.fn((name: string) =>
      name === 'planb_refresh' && refreshValue ? { value: refreshValue } : undefined,
    ),
    delete: vi.fn((name: string) => {
      deleted.push(name);
    }),
  };
  return { store, deleted };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteAccountAction', () => {
  it('devuelve error cuando no hay session', async () => {
    getSessionMock.mockResolvedValue(null);

    const result = await deleteAccountAction(initialDeleteAccountState, new FormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('204 borra cookies y redirige a /sign-in?deleted=1', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000001',
      email: 'lucia@unsta.edu.ar',
      role: 'member',
    });
    const { store, deleted } = fakeCookieStore('refresh-cookie-value');
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    apiFetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteAccountAction(initialDeleteAccountState, new FormData())).rejects.toThrow(
      /NEXT_REDIRECT:\/sign-in\?deleted=1/,
    );

    expect(apiFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/me/account?userId=00000000-0000-4000-a000-000000000001'),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(deleted).toContain('planb_session');
    expect(deleted).toContain('planb_refresh');
  });

  it('404 (user ya borrado) también limpia cookies y redirige', async () => {
    // 404 idempotent: si el row ya está gone, para el usuario el end-state es
    // correcto, así que tratamos como happy path silencioso.
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000002',
      email: 'mateo@unsta.edu.ar',
      role: 'member',
    });
    const { store, deleted } = fakeCookieStore();
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    apiFetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(deleteAccountAction(initialDeleteAccountState, new FormData())).rejects.toThrow(
      /NEXT_REDIRECT:\/sign-in\?deleted=1/,
    );

    expect(deleted).toContain('planb_session');
    expect(deleted).toContain('planb_refresh');
  });

  it('401 surface error pero no toca cookies (la sesión sigue local)', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000003',
      email: 'lucia@unsta.edu.ar',
      role: 'member',
    });
    const { store, deleted } = fakeCookieStore();
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    apiFetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const result = await deleteAccountAction(initialDeleteAccountState, new FormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/sesi[oó]n.*expir/i);
    }
    expect(deleted).not.toContain('planb_session');
    expect(deleted).not.toContain('planb_refresh');
  });

  it('5xx surface error genérico y NO borra cookies', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000004',
      email: 'lucia@unsta.edu.ar',
      role: 'member',
    });
    const { store, deleted } = fakeCookieStore();
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    apiFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const result = await deleteAccountAction(initialDeleteAccountState, new FormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos eliminar/i);
    }
    expect(deleted).not.toContain('planb_session');
  });

  it('network failure surface error y NO borra cookies', async () => {
    getSessionMock.mockResolvedValue({
      userId: '00000000-0000-4000-a000-000000000005',
      email: 'lucia@unsta.edu.ar',
      role: 'member',
    });
    const { store, deleted } = fakeCookieStore();
    // biome-ignore lint/suspicious/noExplicitAny: minimal cookie shim for the test
    cookiesMock.mockResolvedValue(store as any);
    apiFetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await deleteAccountAction(initialDeleteAccountState, new FormData());

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/no pudimos conectarnos/i);
    }
    expect(deleted).not.toContain('planb_session');
  });
});
