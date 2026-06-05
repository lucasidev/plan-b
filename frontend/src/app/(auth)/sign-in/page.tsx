import { AuthHeroHeadline } from '@/components/layout/auth-hero';
import {
  AUTH_HERO_DESCRIPTION,
  AUTH_HERO_QUOTE,
  AUTH_HERO_STATS,
} from '@/components/layout/auth-hero-data';
import { AuthSplit } from '@/components/layout/auth-split';
import { AccountDeactivatedBanner } from '@/features/sign-in/components/account-deactivated-banner';
import { ResetSuccessBanner } from '@/features/sign-in/components/reset-success-banner';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';

// Hoisted heading element: a new ref every render breaks AuthSplit's memo
// (react-doctor/jsx-no-jsx-as-prop rule). Since the headline is static for this page,
// we create it once when the module loads.
const HEADING = <AuthHeroHeadline />;

type Props = {
  searchParams: Promise<{ reset?: string; 'account-deactivated'?: string }>;
};

/**
 * `/sign-in` login screen. Thin server component that builds the shell (AuthSplit with
 * hero) and delegates the form to `<SignInForm>`.
 *
 * `?reset=success` is set by the reset-password flow on 204 (US-033-i).
 * `?account-deactivated=1` is set by the deactivate-account flow (ADR-0044,
 * US-038-bis) after a successful soft delete. Both render a dismissable banner. Any
 * other value in those params is ignored.
 *
 * The cross-flow link "¿Sos nuevo? Creá tu cuenta" navigates to `/sign-up` from inside
 * the form.
 */
export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const resetSuccess = params.reset === 'success';
  const accountDeactivated = params['account-deactivated'] === '1';

  return (
    <AuthSplit
      heading={HEADING}
      description={AUTH_HERO_DESCRIPTION}
      quote={AUTH_HERO_QUOTE}
      stats={AUTH_HERO_STATS}
    >
      {accountDeactivated && <AccountDeactivatedBanner />}
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
