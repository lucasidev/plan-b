import { cn } from '@/lib/utils';

/**
 * Demo embebido de la feature "Reseñas" (US-054-f). Port de `DemoReview`
 * (docs/design/reference/canvas-mocks/landing.jsx, líneas 196-222). Visual
 * puro, sin fetch: una reseña de ejemplo hardcodeada.
 *
 * La atribución no lleva guión largo (a diferencia del mock): mismo criterio
 * que `AuthSplit`'s `quote.attribution`, el texto muted ya se distingue por
 * estilo, no necesita el separador.
 */
export function DemoReview() {
  return (
    <div
      className="bg-bg text-ink-2"
      style={{ borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.5 }}
    >
      <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
        <MpPill className="bg-line-2 text-ink-2">ISW302</MpPill>
        <MpPill className="bg-line-2 text-ink-2">Brandt</MpPill>
        <MpPill className="bg-accent-soft text-accent-ink">
          <Dot />
          dif 4
        </MpPill>
        <span className="flex-1" />
        <span className="font-mono text-ink" style={{ fontSize: 11 }}>
          4.1 ★ · 24
        </span>
      </div>
      "Materia exigente pero el TP final te enseña más que cualquier teórica. Brandt corrige rápido
      y devuelve feedback útil."
      <div
        className="font-mono text-ink-3"
        style={{ marginTop: 8, fontSize: 10.5, letterSpacing: '0.04em' }}
      >
        Anónimo · cursó 2024·2c · 7 (final)
      </div>
    </div>
  );
}

// Port de `.mp` (mono pill): no existe como clase real, ver `demo-sim.tsx`.
function MpPill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center font-mono', className)}
      style={{ gap: 4, fontSize: 10, letterSpacing: '0.02em', padding: '2px 6px', borderRadius: 4 }}
    >
      {children}
    </span>
  );
}

// Port de `.dot`: toma el color del pill que lo contiene vía currentColor.
function Dot() {
  return <span className="inline-block rounded-full bg-current" style={{ width: 4, height: 4 }} />;
}
