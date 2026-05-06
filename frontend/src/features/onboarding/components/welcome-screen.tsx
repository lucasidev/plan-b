import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingShell } from './onboarding-shell';

/**
 * Paso 01 del onboarding (US-037-f). Pantalla sin form: solo bienvenida +
 * CTA "Empecemos" que avanza a paso 02 (`/onboarding/career`).
 *
 * Server component (no usa state ni handlers). Usado por
 * `app/(onboarding)/welcome/page.tsx`.
 */
export function WelcomeScreen({ displayName }: { displayName: string }) {
  return (
    <OnboardingShell
      step={1}
      heading={
        <>
          Bienvenida a plan-b, <em style={{ fontStyle: 'normal' }}>{displayName}</em>.
        </>
      }
      subheading="En 30 segundos asociamos tu carrera y ya podés empezar a leer reseñas de tus materias."
    >
      <ul
        className="text-ink-2"
        style={{ fontSize: 14.5, lineHeight: 1.65, marginBottom: 28, paddingLeft: 20 }}
      >
        <li>Elegí tu universidad, carrera y plan. Eso filtra todo lo que ves después.</li>
        <li>Cargá tu historial cuando quieras (ahora, después, o paso a paso).</li>
        <li>Listo. Inicio te guía con qué hacer en cada momento del cuatri.</li>
      </ul>

      <Link
        href="/onboarding/career"
        prefetch
        className={cn(
          'inline-flex items-center justify-center w-full',
          'bg-accent text-white border border-accent rounded-pill shadow-card',
          'transition-colors hover:bg-accent-hover',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        )}
        style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
      >
        Empecemos
      </Link>
    </OnboardingShell>
  );
}
