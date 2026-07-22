import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { CarnetPreview } from '@/features/sign-up/components/carnet-preview';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <CarnetPreview />;
const FOOT = (
  <>
    ¿Ya tenés cuenta?{' '}
    <Link
      href="/sign-in"
      prefetch
      className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
      style={{ fontWeight: 500 }}
    >
      Ingresá
    </Link>
  </>
);

/**
 * `/sign-up` registration screen. Server component que arma el `AuthShell` v2
 * (eyebrow "01 · Crear cuenta" + `CarnetPreview` a la izquierda) y delega el form
 * a `<SignUpForm>`.
 *
 * Happy path post-registro: POST /api/identity/register → 201 → redirect a
 * `/sign-up/check-inbox?email=`. Migración al canvas v2 en US-059-f; el
 * comportamiento (endpoint, validación) no cambia. El link cross-flow "¿Ya tenés
 * cuenta? Ingresá" vive en el footer del shell.
 */
export default function SignUpPage() {
  return (
    <AuthShell
      stepCode="01"
      stepName="Crear cuenta"
      leftPanel={LEFT_PANEL}
      title="Empezá en 30 segundos"
      sub="Validamos que seas alumno con tu historial académico. Después, lo que escribas es anónimo."
      foot={FOOT}
    >
      <SignUpForm />
    </AuthShell>
  );
}
