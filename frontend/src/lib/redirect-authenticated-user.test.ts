import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirectAuthenticatedUser } from './redirect-authenticated-user';
import { getSession } from './session';

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('./session', () => ({ getSession: vi.fn() }));

describe('guard de páginas de autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: 'member',
      email: 'member@example.com',
      role: 'member',
    });
  });

  it('deja acceder a quien todavía no tiene sesión', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await redirectAuthenticatedUser('/reviews/new');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('conserva materia y cátedra después de que el login crea la sesión', async () => {
    const from = '/reviews/new?subjectId=subject&chairId=chair';
    await redirectAuthenticatedUser(from);
    expect(redirect).toHaveBeenCalledWith(from);
  });

  it.each([
    '/sign-in?from=/sign-in',
    '/sign-up',
    '/sign-up/check-inbox',
    '/verify-email',
    '/forgot-password/check-inbox',
    '/reset-password',
    '//evil.example',
    'https://evil.example',
  ])('evita retornos inválidos o bucles: %s', async (from) => {
    await redirectAuthenticatedUser(from);
    expect(redirect).toHaveBeenCalledWith('/reviews/mine');
  });

  it('sin destino conserva el inicio del rol admin', async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    });
    await redirectAuthenticatedUser();
    expect(redirect).toHaveBeenCalledWith('/admin');
  });
});
