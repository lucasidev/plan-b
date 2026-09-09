import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { AccountDeactivatedBanner } from '@/features/sign-in/components/account-deactivated-banner';
import { HowItWorksPanel } from '@/features/sign-in/components/how-it-works-panel';
import { ResetSuccessBanner } from '@/features/sign-in/components/reset-success-banner';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';
import { resolveSignInGate } from '@/features/sign-in/reason';

type Props = {
  searchParams: Promise<{ reset?: string; 'account-deactivated'?: string; from?: string }>;
};

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <HowItWorksPanel />;

/**
 * `/sign-in` login screen. Server component que arma el `AuthShell` v2 (eyebrow
 * "02 · Ingresar" + `HowItWorksPanel` a la izquierda) y delega el form a
 * `<SignInForm>`.
 *
 * `?reset=success` (US-033-i) y `?account-deactivated=1` (ADR-0044, US-038-bis)
 * renderean un banner dismissable arriba del form. La migración al canvas v2 es
 * US-059-f; el comportamiento (endpoint, validación, banners) no cambia.
 *
 * `?from=` (US-229) es la ruta a la que el gate de una acción manda de vuelta tras entrar: se
 * sanitiza acá (`resolveSignInGate`, nunca se confía en la query cruda) y, si es una acción
 * reconocida, arma el motivo que el form muestra arriba. El link "Creá tu cuenta" lo propaga
 * para que Registro también sepa a dónde volver.
 */
export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const resetSuccess = params.reset === 'success';
  const accountDeactivated = params['account-deactivated'] === '1';
  const { from, reason } = resolveSignInGate(params.from);

  const signUpHref = from ? `/sign-up?from=${encodeURIComponent(from)}` : '/sign-up';
  const foot = (
    <>
      ¿Sos nuevo?{' '}
      <Link
        href={signUpHref}
        prefetch
        className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ fontWeight: 500 }}
      >
        Creá tu cuenta
      </Link>
    </>
  );

  return (
    <AuthShell
      stepCode="02"
      stepName="Ingresar"
      leftPanel={LEFT_PANEL}
      title="Entrá a tu cuenta"
      sub="Ingresá con la cuenta que usaste para registrarte."
      foot={foot}
    >
      {accountDeactivated && <AccountDeactivatedBanner />}
      {resetSuccess && <ResetSuccessBanner />}
      <SignInForm from={from} reason={reason} />
    </AuthShell>
  );
}
