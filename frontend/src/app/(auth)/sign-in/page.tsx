import {
  AUTH_HERO_DESCRIPTION,
  AUTH_HERO_QUOTE,
  AUTH_HERO_STATS,
  AuthHeroHeadline,
} from '@/components/layout/auth-hero';
import { AuthSplit } from '@/components/layout/auth-split';
import { ResetSuccessBanner } from '@/features/sign-in/components/reset-success-banner';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';

type Props = {
  searchParams: Promise<{ reset?: string }>;
};

/**
 * `/sign-in` — pantalla de login. Server component thin que arma el
 * shell (AuthSplit con hero) y delega el form a `<SignInForm>`.
 *
 * `?reset=success` lo setea el flow de reset-password al 204 (US-033-i).
 * Renderiza un banner dismissable confirmando el cambio. Cualquier otro
 * valor en `reset=` se ignora.
 *
 * El cross-flow link "¿Sos nuevo? Creá tu cuenta" navega a `/sign-up`
 * desde dentro del form.
 */
export default async function SignInPage({ searchParams }: Props) {
  const { reset } = await searchParams;
  const resetSuccess = reset === 'success';

  return (
    <AuthSplit
      heading={<AuthHeroHeadline />}
      description={AUTH_HERO_DESCRIPTION}
      quote={AUTH_HERO_QUOTE}
      stats={AUTH_HERO_STATS}
    >
      {resetSuccess && <ResetSuccessBanner />}
      <h2
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          letterSpacing: '-0.02em',
          fontWeight: 600,
          margin: '0 0 8px',
        }}
      >
        Buenas de nuevo
      </h2>
      <p className="text-ink-3" style={{ fontSize: 14, marginBottom: 28 }}>
        Ingresá con la cuenta que usaste para registrarte.
      </p>
      <SignInForm />
    </AuthSplit>
  );
}
