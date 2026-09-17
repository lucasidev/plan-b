import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifyEmailPage from '@/app/(auth)/verify-email/page';
import { verifyEmail } from './api';

const cookieGet = vi.hoisted(() => vi.fn());
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
}));
vi.mock('./api', () => ({ verifyEmail: vi.fn() }));
vi.mock('@/lib/session', () => ({ getSession: vi.fn().mockResolvedValue(null) }));

describe('retorno desde el mail de verificación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyEmail).mockResolvedValue({
      kind: 'success',
      verifiedAt: '2026-09-16T00:00:00Z',
    });
  });

  it('conserva la reseña elegida sin ninguna cookie', async () => {
    cookieGet.mockReturnValue(undefined);
    const from = '/reviews/new?subjectId=abc&chairId=def';
    render(await VerifyEmailPage({ searchParams: Promise.resolve({ token: 'token', from }) }));
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      `/sign-in?from=${encodeURIComponent(from)}`,
    );
  });

  it('el destino del mail gana sobre una reseña anterior en ese navegador', async () => {
    cookieGet.mockReturnValue({ value: '/reviews/new?subjectId=other' });
    const from = '/reviews/new?subjectId=original';
    render(await VerifyEmailPage({ searchParams: Promise.resolve({ token: 'token', from }) }));
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      `/sign-in?from=${encodeURIComponent(from)}`,
    );
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
  ])('rechaza el destino manipulado %s', async (from) => {
    cookieGet.mockReturnValue(undefined);
    render(await VerifyEmailPage({ searchParams: Promise.resolve({ token: 'token', from }) }));
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('los mails antiguos conservan el retorno de su cookie', async () => {
    cookieGet.mockReturnValue({ value: '/reviews/new' });
    render(await VerifyEmailPage({ searchParams: Promise.resolve({ token: 'token' }) }));
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/sign-in?from=%2Freviews%2Fnew',
    );
  });
});
