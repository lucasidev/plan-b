import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { CarnetPreview } from '@/features/sign-up/components/carnet-preview';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';
import { sanitizeInternalRedirect } from '@/lib/internal-redirect';

type Props = {
  searchParams: Promise<{ from?: string }>;
};

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <CarnetPreview />;

/**
 * `/sign-up` registration screen. Server component que arma el `AuthShell` v2
 * (eyebrow "01 · Crear cuenta" + `CarnetPreview` a la izquierda) y delega el form
 * a `<SignUpForm>`.
 *
 * Happy path post-registro: POST /api/identity/register → 202 (exista o no la cuenta, ADR-0076) → redirect a
 * `/sign-up/check-inbox?email=`. Migración al canvas v2 en US-059-f; el
 * comportamiento (endpoint, validación) no cambia. El link cross-flow "¿Ya tenés
 * cuenta? Ingresá" vive en el footer del shell.
 *
 * `?from=` (US-229) llega de Ingresar cuando el gate de una acción mandó primero ahí: se
 * sanitiza (nunca se confía en la query cruda) y se propaga al form y al link "Ingresá", para
 * que quien ya tiene cuenta y se equivocó de puerta no pierda el destino.
 */
export default async function SignUpPage({ searchParams }: Props) {
  const { from: rawFrom } = await searchParams;
  const from = sanitizeInternalRedirect(rawFrom);

  const signInHref = from ? `/sign-in?from=${encodeURIComponent(from)}` : '/sign-in';
  const foot = (
    <>
      ¿Ya tenés cuenta?{' '}
      <Link
        href={signInHref}
        prefetch
        className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ fontWeight: 500 }}
      >
        Ingresá
      </Link>
    </>
  );

  return (
    <AuthShell
      stepCode="01"
      stepName="Crear cuenta"
      leftPanel={LEFT_PANEL}
      title="Empezá en 30 segundos"
      sub="Tu mail confirma que la cuenta es tuya. Ninguna reseña se muestra sola: tu reseña entra en los conteos de la cátedra."
      foot={foot}
    >
      <SignUpForm from={from} />
    </AuthShell>
  );
}
