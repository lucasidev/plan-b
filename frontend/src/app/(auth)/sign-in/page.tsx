import Link from 'next/link';
import { AuthShell } from '@/components/layout/auth-shell';
import { AccountDeactivatedBanner } from '@/features/sign-in/components/account-deactivated-banner';
import { LastActivityPanel } from '@/features/sign-in/components/last-activity-panel';
import { ResetSuccessBanner } from '@/features/sign-in/components/reset-success-banner';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';

type Props = {
  searchParams: Promise<{ reset?: string; 'account-deactivated'?: string }>;
};

// Hoisted para no crear refs nuevas por render (regla react-doctor/jsx-no-jsx-as-prop).
const LEFT_PANEL = <LastActivityPanel />;
const FOOT = (
  <>
    ¿Sos nuevo?{' '}
    <Link
      href="/sign-up"
      prefetch
      className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
      style={{ fontWeight: 500 }}
    >
      Creá tu cuenta
    </Link>
  </>
);

/**
 * `/sign-in` login screen. Server component que arma el `AuthShell` v2 (eyebrow
 * "02 · Ingresar" + `LastActivityPanel` a la izquierda) y delega el form a
 * `<SignInForm>`.
 *
 * `?reset=success` (US-033-i) y `?account-deactivated=1` (ADR-0044, US-038-bis)
 * renderean un banner dismissable arriba del form. La migración al canvas v2 es
 * US-059-f; el comportamiento (endpoint, validación, banners) no cambia.
 */
export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const resetSuccess = params.reset === 'success';
  const accountDeactivated = params['account-deactivated'] === '1';

  return (
    <AuthShell
      stepCode="02"
      stepName="Ingresar"
      leftPanel={LEFT_PANEL}
      title="Buenas de nuevo"
      sub="Ingresá con la cuenta que usaste para registrarte."
      foot={FOOT}
    >
      {accountDeactivated && <AccountDeactivatedBanner />}
      {resetSuccess && <ResetSuccessBanner />}
      <SignInForm />
    </AuthShell>
  );
}
