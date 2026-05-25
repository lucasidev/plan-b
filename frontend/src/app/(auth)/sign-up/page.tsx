import { AuthHeroHeadline } from '@/components/layout/auth-hero';
import {
  AUTH_HERO_DESCRIPTION,
  AUTH_HERO_QUOTE,
  AUTH_HERO_STATS,
} from '@/components/layout/auth-hero-data';
import { AuthSplit } from '@/components/layout/auth-split';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';

// Hoisted heading element para evitar nueva ref en cada render (regla
// react-doctor/jsx-no-jsx-as-prop). El headline es estático para esta page.
const HEADING = <AuthHeroHeadline />;

/**
 * `/sign-up` — pantalla de registro. Server component thin que arma el
 * shell (AuthSplit con hero) y delega el form a `<SignUpForm>`.
 *
 * El cross-flow link "¿Ya tenés cuenta? Ingresá" navega a `/sign-in`
 * desde dentro del form. El happy-path post-registro es:
 *   POST /api/identity/register → 201 → redirect a `/sign-up/check-inbox?email=`.
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
