'use client';

import { useState } from 'react';
import { SignInForm } from '@/features/sign-in/components/sign-in-form';
import { SignUpForm } from '@/features/sign-up/components/sign-up-form';
import { cn } from '@/lib/utils';
import { AuthSplit } from './auth-split';

export type AuthMode = 'signin' | 'signup';

type Props = {
  /** Initial mode chosen by the page based on `?mode=` (signup) or default
   *  (signin). After mount the local switcher takes over: clicks flip the
   *  active form without navigating. */
  initialMode: AuthMode;
};

/**
 * Single-route auth shell. Mounted by `(auth)/auth/page.tsx`; the page
 * reads `searchParams.mode` and passes it through. Direct port of the
 * auth screen from docs/design/reference/components/screens.jsx.
 *
 * Frontend exposes one URL (`/auth`) and swaps the form in place; backend
 * keeps `POST /api/identity/sign-in` and `POST /api/identity/register`
 * as separate endpoints. The forms get a setter as a prop so the in-form
 * footer link ("¿Sos nuevo? Creá tu cuenta" / "¿Ya tenés cuenta? Ingresá")
 * flips the mode without navigating either.
 */
export function AuthView({ initialMode }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const formCopy = FORM_COPY[mode];

  return (
    <AuthSplit
      heading={
        <h1
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 56,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Antes de inscribirte,
          <br />
          mirá <em style={{ fontStyle: 'normal' }}>quiénes ya pasaron</em>
          <br />
          por esa materia.
        </h1>
      }
      description="plan-b es la app donde alumnos de UNSTA simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros."
      quote={HERO_QUOTE}
      stats={HERO_STATS}
    >
      <ModeSwitcher mode={mode} onChange={setMode} />
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
        {formCopy.heading}
      </h2>
      <p className="text-ink-3" style={{ fontSize: 14, marginBottom: 28 }}>
        {formCopy.subheading}
      </p>
      {mode === 'signup' ? (
        <SignUpForm onSwitchToSignIn={() => setMode('signin')} />
      ) : (
        <SignInForm onSwitchToSignUp={() => setMode('signup')} />
      )}
    </AuthSplit>
  );
}

// Hero stats: 3 métricas que dan presencia al hero. Hardcoded hasta que
// aterrice GET /api/stats/public (universities desde Academic, members
// desde Identity, reviews desde Reviews, query agregada cross-module sin
// auth, US separada). Cuando exista el endpoint, este const se reemplaza
// por un fetch RSC y este componente queda intacto.
const HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
  { label: 'universidades', value: '3' },
];

// Testimonial fijo del mockup. Hardcoded por el mismo motivo que las stats:
// cuando exista un sistema de testimonials reales (post-MVP), se rota.
const HERO_QUOTE = {
  text: '"Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una comisión de 2c con 4.1★ vs 3.4★. Esperé un cuatri."',
  attribution: 'Anónimo · 4° año Sistemas',
};

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
 * `.auth-tabs` from styles.css. Pill rail align-self flex-start (not full
 * width). Active segment lifts to bg-card with a card shadow.
 */
function ModeSwitcher({ mode, onChange }: { mode: AuthMode; onChange: (next: AuthMode) => void }) {
  return (
    <div
      className="inline-flex bg-bg-elev rounded-pill self-start"
      style={{ padding: 4, marginBottom: 24 }}
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
        'rounded-pill transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        active ? 'bg-bg-card text-ink shadow-card' : 'bg-transparent text-ink-3 hover:text-ink',
      )}
      style={{ padding: '8px 18px', fontSize: 13, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}
