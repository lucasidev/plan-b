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
 * with the marketing column on the left and switcher + heading + active
 * form on the right.
 *
 * The mode toggle is **local state**, not navigation: clicking "Ingresar"
 * from the sign-up screen swaps the form in place (matching the mockup's
 * `setMode('login')` button). The URL stays where the user landed so deep
 * links to /sign-up vs /sign-in still work for sharing. The forms also get
 * the setter as a prop so the in-form footer link ("¿Sos nuevo? Creá tu
 * cuenta") flips the mode without navigating either.
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
        {mode === 'signup' ? (
          <SignUpForm onSwitchToSignIn={() => setMode('signin')} />
        ) : (
          <SignInForm onSwitchToSignUp={() => setMode('signup')} />
        )}
      </div>
    </AuthSplit>
  );
}

// Hero stats: 3 métricas que dan presencia al hero del auth. La interfaz va
// primero (filosofía de trabajo); estos valores son hardcodeados hasta que
// aterrice GET /api/stats/public (universities count desde Academic, members
// desde Identity, reviews desde Reviews — query agregada cross-module sin
// auth, backlog como US separada). Cuando exista, este const se reemplaza
// por un fetch RSC y este componente queda intacto en su shape.
const HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
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

/**
 * Pill-shaped switcher, two segments. Active segment is bg-card (white-ish
 * on the cream background) with a thin border; inactive sits on bg-elev
 * with the same border to keep the rail height consistent. Matches the
 * mockup's auth-tabs.
 */
function ModeSwitcher({ mode, onChange }: { mode: AuthMode; onChange: (next: AuthMode) => void }) {
  return (
    <div
      className={cn(
        'inline-flex rounded-pill border border-line bg-bg-elev p-1',
        'text-sm font-medium',
      )}
      role="tablist"
      aria-label="Modo de autenticación"
    >
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
        'px-4 py-1.5 rounded-pill transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        active ? 'bg-bg-card text-ink shadow-card' : 'bg-transparent text-ink-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
