import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingShell } from './onboarding-shell';

type Props = {
  /** Nombre humano (display name) que se muestra en el saludo final. */
  displayName: string;
  /** Nombre de la carrera asociada en el paso 02 (para el resumen). */
  careerName?: string;
  /** Año del plan vigente (Plan 2018, etc.). */
  planYear?: number;
};

/**
 * Paso 04 del onboarding (US-037-f). Confirmación final + CTA "Ir a Inicio".
 *
 * Si el caller pasa `careerName` y `planYear`, se muestra un resumen del
 * profile recién creado. Si no (caso "lo cargo después" sin haber pasado
 * por paso 02 — no debería ocurrir por el guard, pero lo cubrimos), solo
 * se muestra el saludo.
 *
 * Server component, sin state.
 */
export function DoneScreen({ displayName, careerName, planYear }: Props) {
  return (
    <OnboardingShell
      step={4}
      heading={
        <>
          ¡Listo, <em style={{ fontStyle: 'normal' }}>{displayName}</em>!
        </>
      }
      subheading="Ya podés entrar y empezar a usar plan-b."
    >
      <div
        className="flex items-start gap-3 bg-st-approved-bg text-st-approved-fg"
        style={{
          padding: 14,
          borderRadius: 8,
          marginBottom: 24,
          border: '1px solid color-mix(in oklch, var(--color-st-approved-fg) 30%, transparent)',
        }}
      >
        <CheckCircle2 size={18} aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
        <div className="flex-1" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
          <b style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Tu cuenta quedó asociada
          </b>
          {careerName && planYear ? (
            <span>
              {careerName} · Plan {planYear}.
            </span>
          ) : (
            <span>Carrera y plan listos.</span>
          )}
        </div>
      </div>

      <Link
        href="/home"
        prefetch
        className={cn(
          'inline-flex items-center justify-center w-full',
          'bg-accent text-white border border-accent rounded-pill shadow-card',
          'transition-colors hover:bg-accent-hover',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        )}
        style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
      >
        Ir a Inicio
      </Link>
    </OnboardingShell>
  );
}
