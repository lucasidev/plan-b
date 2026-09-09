import { cookies } from 'next/headers';
import { AuthCard } from '@/components/layout/auth-card';
import { verifyEmail } from '@/features/verify-email/api';
import { VerifyEmailResult } from '@/features/verify-email/components/verify-email-result';
import { RETURN_TO_COOKIE, sanitizeInternalRedirect } from '@/lib/internal-redirect';

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
 *
 * El link de este mail lo arma el backend sin saber a dónde volver (US-229): la cookie que
 * `signUpAction` dejó al registrarse es lo único que sobrevivió el salto a la casilla de
 * correo, así que acá se lee (nunca se confía en su valor crudo) para que "Iniciar sesión"
 * lleve el `from` de vuelta a Ingresar.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : ({ kind: 'missing_token' } as const);
  const cookieStore = await cookies();
  const from = sanitizeInternalRedirect(cookieStore.get(RETURN_TO_COOKIE)?.value);

  return (
    <AuthCard>
      <VerifyEmailResult result={result} from={from} />
    </AuthCard>
  );
}
