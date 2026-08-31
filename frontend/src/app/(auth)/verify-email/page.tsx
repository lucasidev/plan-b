import { AuthCard } from '@/components/layout/auth-card';
import { verifyEmail } from '@/features/verify-email/api';
import { VerifyEmailResult } from '@/features/verify-email/components/verify-email-result';

type Props = {
  searchParams: Promise<{ token?: string }>;
};

/**
 * Verify-email route (US-011-f). Server component: reads `token` from the
 * URL, calls POST /api/identity/verify-email server-side, and hands the
 * mapped VerifyEmailResult to the result component. Done in RSC because
 * (a) we don't need client interactivity for read-only outcomes, (b) the
 * token consumption is a one-shot side effect we want to do once on
 * navigation, not on every client render.
 *
 * If the URL has no token, we render the missing_token state without
 * even hitting the backend: that's a wrong arrival, not a verification
 * attempt.
 *
 * Va en `AuthCard`, el shell de las pantallas de transición, y no en el de dos columnas: es un
 * aterrizaje de una sola vez. Además el shell viejo le ponía un hero encima ("Verificá tu cuenta"
 * + "estamos confirmando tu email") sobre un resultado que ya dice "¡Listo! Tu cuenta quedó
 * verificada": dos títulos para un solo hecho.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : ({ kind: 'missing_token' } as const);

  return (
    <AuthCard>
      <VerifyEmailResult result={result} />
    </AuthCard>
  );
}
