'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  /** True when the page was reached from the reset-password 204 redirect
   *  (`?reset=success`). Renders a dismissable banner above the switcher. */
  resetSuccess?: boolean;
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
export function AuthView({ initialMode, resetSuccess = false }: Props) {
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
      {resetSuccess && <ResetSuccessBanner />}
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
// cuando exista un sistema real de testimonials, este valor se reemplaza
// por una rotación dinámica.
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
 * Confirmation banner rendered after a successful password reset. Auto-dismisses
 * after 8s (per US-033-f AC) and is also dismissable manually via the close
 * button. Pure UI: the source of truth (`?reset=success`) is server-driven by
 * the AuthPage; closing the banner does NOT clean the URL because the param
 * is harmless and the banner ignores stale state on the next render.
 */
function ResetSuccessBanner() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded bg-st-approved-bg text-st-approved-fg"
      style={{
        padding: '10px 12px',
        marginBottom: 18,
        fontSize: 13,
        border: '1px solid color-mix(in oklch, var(--color-st-approved-fg) 30%, transparent)',
      }}
    >
      <CheckCircle2 size={16} aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
      <p className="flex-1" style={{ lineHeight: 1.45 }}>
        <b style={{ fontWeight: 600 }}>Listo.</b> Ya podés ingresar con tu nueva contraseña.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar mensaje"
        className="text-ink-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ padding: 2, marginTop: -2, marginRight: -4, lineHeight: 0 }}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}

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
