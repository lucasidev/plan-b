import { cn } from '@/lib/utils';

type Props = {
  /** Step actual (1 a 4). Manda el dot indicator + accessibility label. */
  step: 1 | 2 | 3 | 4;
  /** Heading display-size del step. */
  heading: React.ReactNode;
  /** Subheading / lede en gris. Opcional. */
  subheading?: React.ReactNode;
  /** Form / card / cualquier contenido del step. */
  children: React.ReactNode;
};

const TOTAL_STEPS = 4;

/**
 * Shell visual común de las 4 páginas del onboarding (US-037-f). Mismo cream
 * background + radial glow que `/sign-up/check-inbox` para mantener tonalmente
 * cohesivo el tramo "verificación + onboarding". La card es más ancha que la
 * de check-inbox porque algunos pasos (career, history) tienen forms con
 * varios campos.
 *
 * El stepper de dots arriba comunica progreso sin ocupar mucho espacio. Cada
 * dot es etiquetado para screen readers vía `aria-label`.
 */
export function OnboardingShell({ step, heading, subheading, children }: Props) {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg,#fbe5d6_0%,#fbf3ec_60%)',
        padding: '48px 24px',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgb(224 122 77 / 18%) 0, transparent 40%), radial-gradient(circle at 20% 90%, rgb(224 122 77 / 12%) 0, transparent 35%)',
        }}
      />

      <div
        className="relative z-10 flex flex-col bg-bg-card border border-line shadow-card"
        style={{
          width: '100%',
          maxWidth: 560,
          padding: '40px 40px 32px',
          borderRadius: 18,
        }}
      >
        <Stepper step={step} />

        <header style={{ marginTop: 24 }}>
          <h1
            className="text-ink"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {heading}
          </h1>
          {subheading && (
            <p
              className="text-ink-2"
              style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 10, maxWidth: '52ch' }}
            >
              {subheading}
            </p>
          )}
        </header>

        <div style={{ marginTop: 28 }}>{children}</div>
      </div>
    </main>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  // El nav lleva el aria-label del progreso y un texto sr-only describe el
  // estado actual ("Paso X de Y"). Los dots individuales son decorativos
  // (aria-hidden); poner aria-label en cada <span> sin role no aplica
  // (biome lint a11y/useAriaPropsSupportedByRole).
  return (
    <nav aria-label="Progreso del onboarding" className="flex items-center" style={{ gap: 8 }}>
      <span className="sr-only">{`Paso ${step} de ${TOTAL_STEPS}`}</span>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const dotStep = (i + 1) as 1 | 2 | 3 | 4;
        const active = dotStep === step;
        const done = dotStep < step;
        return (
          <span
            key={dotStep}
            aria-hidden="true"
            className={cn(
              'block transition-colors',
              active ? 'bg-accent' : done ? 'bg-accent-soft' : 'bg-line',
            )}
            style={{
              width: active ? 28 : 10,
              height: 10,
              borderRadius: 999,
            }}
          />
        );
      })}
    </nav>
  );
}
