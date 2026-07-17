import { Logo } from '@/components/ui';
import { INDEPENDENT_PROJECT_DISCLAIMER } from '@/lib/copy';

type Props = {
  /** Eyebrow: código de paso, ej. "02". */
  stepCode: string;
  /** Eyebrow: nombre del paso, ej. "Ingresar". */
  stepName: string;
  /** Panel izquierdo, específico por vista (LastActivityPanel / CarnetPreview / FlowSteps). */
  leftPanel: React.ReactNode;
  /** Título H2 (display 36px). */
  title: string;
  /** Párrafo opcional bajo el título. */
  sub?: React.ReactNode;
  /** Contenido de la columna del form. */
  children: React.ReactNode;
  /** Footer de la columna del form (link cross-flow). */
  foot: React.ReactNode;
};

/**
 * Shell v2 del route group `(auth)`. Port de `AuthShell`
 * (docs/design/reference/canvas-mocks/auth.jsx). Reemplaza a `AuthSplit` (hero
 * de marketing pre-canvas-v2) en las vistas migradas (US-059-f).
 *
 * Grid 1.05fr/1fr: panel izquierdo con eyebrow numerado + contenido de producto
 * por vista (`leftPanel`); columna derecha con header (logo + "beta") + form
 * centrado + footer. Colapsa a 1 columna en < 1024px (el panel izq se oculta,
 * el form ocupa el 100%). Copy multi-universidad: el disclaimer es genérico, no
 * nombra UNSTA.
 */
export function AuthShell({ stepCode, stepName, leftPanel, title, sub, children, foot }: Props) {
  return (
    <div className="grid min-h-screen bg-bg text-ink grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Panel izquierdo: decorativo pero específico por vista. Oculto en mobile. */}
      <aside
        className="relative hidden lg:flex flex-col overflow-hidden bg-bg-elev border-r border-line"
        style={{ padding: '48px 56px' }}
      >
        <div
          className="font-mono uppercase text-accent-ink"
          style={{ fontSize: 11, letterSpacing: '0.1em' }}
        >
          {stepCode} · <span className="text-ink-3">{stepName}</span>
        </div>

        <div className="flex flex-1 flex-col justify-center" style={{ margin: '32px 0' }}>
          {leftPanel}
        </div>

        <div
          className="flex justify-between font-mono text-ink-4"
          style={{ fontSize: 10.5, letterSpacing: '0.06em' }}
        >
          <span>plan-b · proyecto independiente</span>
          <span>{INDEPENDENT_PROJECT_DISCLAIMER}</span>
        </div>
      </aside>

      {/* Columna derecha: form. */}
      <main className="flex flex-col" style={{ padding: '48px 56px' }}>
        <header className="flex items-center justify-between">
          <Logo size={26} />
          <span
            className="font-mono uppercase text-ink-3"
            style={{ fontSize: 10.5, letterSpacing: '0.06em' }}
          >
            beta
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center w-full" style={{ maxWidth: 480 }}>
          <h2
            className="text-ink"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: '-0.022em',
              lineHeight: 1.05,
              margin: '0 0 8px',
            }}
          >
            {title}
          </h2>
          {sub && (
            <p
              className="text-ink-3"
              style={{ fontSize: 14.5, lineHeight: 1.5, margin: '0 0 28px', maxWidth: '46ch' }}
            >
              {sub}
            </p>
          )}
          {children}
        </div>

        <footer
          className="text-ink-3"
          style={{ fontSize: 13, paddingTop: 24, borderTop: '1px solid var(--color-line)' }}
        >
          {foot}
        </footer>
      </main>
    </div>
  );
}
