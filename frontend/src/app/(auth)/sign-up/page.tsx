import {
  AUTH_HERO_DESCRIPTION,
  AUTH_HERO_QUOTE,
  AUTH_HERO_STATS,
  AuthHeroHeadline,
} from '@/components/layout/auth-hero';
import { AuthSplit } from '@/components/layout/auth-split';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';

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
      heading={<AuthHeroHeadline />}
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
