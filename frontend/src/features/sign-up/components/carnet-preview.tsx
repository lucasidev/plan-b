import { cn } from '@/lib/utils';

/**
 * Panel izquierdo del sign-up (`AuthShell` leftPanel). Port de `CarnetPreview`
 * (docs/design/reference/canvas-mocks/auth.jsx): muestra las dos formas de la
 * identidad (privada, solo vos; pública, anónima) que verán los demás cuando
 * reseñes.
 *
 * Visual estático en MVP (US-059-f): no se conecta al estado del form. Copy
 * multi-universidad: sin marca UNSTA hardcodeada (email genérico, "hacia afuera"
 * en vez de "hacia el resto de UNSTA", sin chip de universidad).
 */
export function CarnetPreview() {
  return (
    <div className="flex flex-col" style={{ gap: 18, maxWidth: 420 }}>
      <div>
        <h3
          className="text-ink"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.018em',
            margin: '0 0 6px',
          }}
        >
          Tu identidad, en dos formas.
        </h3>
        <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
          Adentro del producto sos vos. Hacia afuera, sos anónimo.
        </p>
      </div>

      {/* Carnet privado: solo lo ves vos */}
      <div
        className="relative bg-bg-card border border-line shadow-card"
        style={{ borderRadius: 14, padding: '18px 20px' }}
      >
        <span
          className="absolute font-mono uppercase text-ink-3"
          style={{ top: 14, right: 14, fontSize: 9.5, letterSpacing: '0.08em' }}
        >
          privado · solo vos
        </span>
        <div className="flex items-center" style={{ gap: 14 }}>
          <div
            className="grid place-items-center bg-accent-soft text-accent-ink"
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            LM
          </div>
          <div>
            <div className="text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
              Lucía Mansilla
            </div>
            <div className="font-mono text-ink-3" style={{ fontSize: 11.5, marginTop: 2 }}>
              lucia.mansilla@gmail.com
            </div>
          </div>
        </div>
        <div
          className="flex flex-wrap"
          style={{
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--color-line)',
          }}
        >
          <Chip approved>
            <Dot />
            email verificado
          </Chip>
          <Chip>Sistemas · 4° año</Chip>
        </div>
      </div>

      {/* Conector entre las dos vistas */}
      <div
        className="flex items-center font-mono text-ink-3"
        style={{ gap: 10, fontSize: 11.5, letterSpacing: '0.04em' }}
      >
        <span className="flex-1 bg-line" style={{ height: 1 }} />
        <span>al reseñar te ven así →</span>
        <span className="flex-1 bg-line" style={{ height: 1 }} />
      </div>

      {/* Carnet público: anónimo */}
      <div
        className="relative bg-ink"
        style={{ borderRadius: 14, padding: '18px 20px', color: 'var(--color-bg)' }}
      >
        <span
          className="absolute font-mono uppercase text-ink-4"
          style={{ top: 14, right: 14, fontSize: 9.5, letterSpacing: '0.08em' }}
        >
          público · anónimo
        </span>
        <div className="flex items-center" style={{ gap: 14 }}>
          <div
            className="grid place-items-center text-accent"
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: '#2a1d12',
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            ?
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Anónimo</div>
            <div className="text-ink-4 font-mono" style={{ fontSize: 11.5, marginTop: 2 }}>
              Sistemas · 4° año · cursó 2024·2c
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #1a110a',
            fontSize: 12.5,
            color: '#d8c9bc',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          "ISW302 con Brandt: exigente pero el TP final te enseña más que cualquier teórica…"
        </div>
      </div>
    </div>
  );
}

function Chip({ children, approved }: { children: React.ReactNode; approved?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center font-mono', !approved && 'bg-bg-elev text-ink-2')}
      style={{
        gap: 5,
        fontSize: 10.5,
        letterSpacing: '0.04em',
        padding: '3px 9px',
        borderRadius: 999,
        ...(approved
          ? { background: 'var(--color-st-approved-bg)', color: 'var(--color-st-approved-fg)' }
          : {}),
      }}
    >
      {children}
    </span>
  );
}

function Dot() {
  return (
    <span
      className="inline-block"
      style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: 'var(--color-st-approved-fg)',
      }}
    />
  );
}
