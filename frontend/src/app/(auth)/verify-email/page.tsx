import { cookies } from 'next/headers';
import { AuthCard } from '@/components/layout/auth-card';
import { verifyEmail } from '@/features/verify-email/api';
import { VerifyEmailResult } from '@/features/verify-email/components/verify-email-result';
import { RETURN_TO_COOKIE, sanitizeInternalRedirect } from '@/lib/internal-redirect';
import { redirectAuthenticatedUser } from '@/lib/redirect-authenticated-user';

type Props = {
  searchParams: Promise<{ token?: string; from?: string }>;
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
 *
 * El destino del mail tiene prioridad sobre la cookie: el link puede abrirse desde otro
 * dispositivo o desde un navegador que empezó una reseña distinta (US-229).
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  await redirectAuthenticatedUser();
  const { token, from: rawFrom } = await searchParams;
  const result = token ? await verifyEmail(token) : ({ kind: 'missing_token' } as const);
  const cookieStore = await cookies();
  const from =
    sanitizeInternalRedirect(rawFrom) ??
    sanitizeInternalRedirect(cookieStore.get(RETURN_TO_COOKIE)?.value);

  return (
    <AuthCard>
      <VerifyEmailResult result={result} from={from} />
    </AuthCard>
  );
}
