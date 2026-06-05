import { AuthHeroHeadline } from '@/components/layout/auth-hero';
import {
  AUTH_HERO_DESCRIPTION,
  AUTH_HERO_QUOTE,
  AUTH_HERO_STATS,
} from '@/components/layout/auth-hero-data';
import { AuthSplit } from '@/components/layout/auth-split';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';

// Hoisted heading element to avoid a new ref on every render
// (react-doctor/jsx-no-jsx-as-prop rule). The headline is static for this page.
const HEADING = <AuthHeroHeadline />;

/**
 * `/sign-up` registration screen. Thin server component that builds the shell
 * (AuthSplit with hero) and delegates the form to `<SignUpForm>`.
 *
 * The cross-flow "¿Ya tenés cuenta? Ingresá" link navigates to `/sign-in` from inside
 * the form. The post-registration happy path is:
 *   POST /api/identity/register → 201 → redirect to `/sign-up/check-inbox?email=`.
 */
export default function SignUpPage() {
  return (
    <AuthSplit
      heading={HEADING}
      description={AUTH_HERO_DESCRIPTION}
      quote={AUTH_HERO_QUOTE}
      stats={AUTH_HERO_STATS}
    >
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
        Empezá en 30 segundos
      </h2>
      <p className="text-ink-3" style={{ fontSize: 14, marginBottom: 28 }}>
        Registrate con tu email para empezar a leer reseñas y dejar las tuyas.
      </p>
      <SignUpForm />
    </AuthSplit>
  );
}
