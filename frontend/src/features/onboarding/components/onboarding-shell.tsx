import { Logo } from '@/components/ui';
import { OnbExitButton } from './onb-exit-button';

type Props = {
  /** Current step (1 to 4). Drives the pill label + progress bar. */
  step: 1 | 2 | 3 | 4;
  /** Total steps. Defaults to 4. */
  total?: number;
  /** Display-size heading for the step. */
  heading: React.ReactNode;
  /** Subheading / lede in grey. Optional. */
  subheading?: React.ReactNode;
  /** Form / card / any content for the step. */
  children: React.ReactNode;
  /** Optional footer bar (nav CTAs). */
  footer?: React.ReactNode;
};

const TOTAL_STEPS = 4;

/**
 * Shell v2 del onboarding (US-059-f). Port de `OnbShell`
 * (docs/design/reference/canvas-mocks/onboarding.jsx): topbar fija con logo +
 * pill "Configuración inicial · paso N de N" + progress bar lineal + "Salir",
 * card central y footer opcional.
 *
 * Reemplaza el shell viejo (gradiente cream + dot stepper) sin cambiar la API que
 * consumen las 4 páginas: el progreso pasó del stepper de dots a la barra del
 * topbar, y la card + heading/subheading/children se conservan (US-059-f
 * reenmarca el contenido, no lo reescribe).
 */
export function OnboardingShell({
  step,
  total = TOTAL_STEPS,
  heading,
  subheading,
  children,
  footer,
}: Props) {
  const fillWidth = `${(step / total) * 100}%`;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      {/* Topbar: logo + pill de progreso + barra lineal + salir */}
      <header
        className="flex items-center border-b border-line"
        style={{ gap: 14, padding: '14px 24px' }}
      >
        <Logo size={24} />
        <span
          className="inline-flex items-center font-mono text-ink-3 bg-bg-card border border-line"
          style={{ gap: 7, fontSize: 11, padding: '4px 11px', borderRadius: 999 }}
        >
          <span
            className="inline-block bg-accent"
            style={{ width: 5, height: 5, borderRadius: '50%' }}
          />
          Configuración inicial · paso {step} de {total}
        </span>
        <span className="flex-1" />
        <div
          aria-hidden
          className="relative bg-line-2"
          style={{ flex: '0 0 220px', height: 3, borderRadius: 99 }}
        >
          <div
            className="absolute inset-0 bg-accent"
            style={{ width: fillWidth, borderRadius: 99 }}
          />
        </div>
        <OnbExitButton />
      </header>

      {/* Card central con el contenido del paso */}
      <div className="flex flex-1 items-center justify-center" style={{ padding: '24px 24px' }}>
        <div
          className="flex w-full flex-col bg-bg-card border border-line shadow-card"
          style={{ maxWidth: 560, padding: '40px 40px 32px', borderRadius: 18 }}
        >
          <header>
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
      </div>

      {/* Footer opcional (nav CTAs) */}
      {footer && (
        <div
          className="flex items-center border-t border-line"
          style={{ gap: 12, padding: '18px 32px' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
