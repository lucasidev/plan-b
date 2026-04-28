'use client';

import { useState } from 'react';
import { DisplayHeading, Lede } from '@/components/ui';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';
import { cn } from '@/lib/utils';
import { AuthSplit } from './auth-split';

export type AuthMode = 'signin' | 'signup';

type Props = {
  /** Initial mode driven by the URL the user landed on (/sign-up vs /sign-in).
   *  After mount, the in-place switcher takes over and changes mode without
   *  navigating, matching the mockup. */
  initialMode: AuthMode;
};

/**
 * Shared shell for `(auth)/sign-up` and `(auth)/sign-in`. Wraps AuthSplit
 * with the marketing column on the left and tabs + form-side heading +
 * the active form on the right.
 *
 * The mode toggle is **local state**, not navigation: clicking "Ingresar"
 * from the sign-up screen swaps the form in place (matching the mockup's
 * `setMode('login')` button). The URL stays where the user landed so deep
 * links to /sign-up vs /sign-in still work for sharing.
 *
 * Why client component: the toggle is local UI state. Both forms are
 * already client components (useActionState / useFormStatus), so making
 * the parent client too costs nothing — actually slightly cheaper because
 * the page doesn't need to re-render shell when the mode flips.
 *
 * Differences from the mockup (intentional, see design/reference/README.md):
 * - No `@unsta.edu.ar` gate. Per US-010-f, anyone with a valid email format
 *   can register; the platform is multi-university (ADR-0001) and an
 *   institutional gate would contradict that.
 * - No "Continuar con Google" button. OAuth is out of MVP scope.
 * - No name field on sign-up; the backend's RegisterUser command takes only
 *   email + password. A display name belongs to StudentProfile, which lands
 *   later in F3.
 * - No "olvidé contraseña" link. The reset flow has no backend support yet.
 */
export function AuthView({ initialMode }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const formCopy = FORM_COPY[mode];

  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Antes de inscribirte,
          <br />
          mirá <em>quiénes ya pasaron</em>
          <br />
          por esa materia.
        </DisplayHeading>
      }
      description="plan-b es donde alumnos simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros."
      stats={HERO_STATS}
    >
      <div className="space-y-6">
        <ModeSwitcher mode={mode} onChange={setMode} />
        <header className="space-y-2">
          <DisplayHeading as="h2" size={28}>
            {formCopy.heading}
          </DisplayHeading>
          <Lede>{formCopy.subheading}</Lede>
        </header>
        {mode === 'signup' ? <SignUpForm /> : <SignInForm />}
      </div>
    </AuthSplit>
  );
}

// Hardcoded for the MVP launch: planb arranca con tres universidades
// precargadas (UNSTA inicial, más dos del foco de F6). El `340 alumnos /
// 1.2k reseñas` del mockup eran números de demostración; los dejamos fuera
// hasta tener data real para no mentirle al usuario en la home.
const HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'universidades', value: '3' },
];

const FORM_COPY: Record<AuthMode, { heading: string; subheading: string }> = {
  signup: {
    heading: 'Empezá en 30 segundos',
    subheading: 'Registrate con tu email para empezar a leer reseñas y dejar las tuyas.',
  },
  signin: {
    heading: 'Buenas de nuevo',
    subheading: 'Ingresá con la cuenta que usaste para registrarte.',
  },
};

function ModeSwitcher({ mode, onChange }: { mode: AuthMode; onChange: (next: AuthMode) => void }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Modo de autenticación">
      <ModeButton active={mode === 'signup'} onClick={() => onChange('signup')}>
        Crear cuenta
      </ModeButton>
      <ModeButton active={mode === 'signin'} onClick={() => onChange('signin')}>
        Ingresar
      </ModeButton>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 text-center rounded-pill border px-4 py-2',
        'text-sm font-medium transition-colors',
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-bg-card text-ink-2 border-line hover:bg-bg-elev hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
