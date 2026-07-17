const RATING_BARS = [
  { label: 'Claridad', value: 0.78 },
  { label: 'Exigencia', value: 0.84 },
  { label: 'Buena onda', value: 0.62 },
] as const;

/**
 * Demo embebido de la feature "Simulador" (US-054-f). Port de `DemoProf`
 * (docs/design/reference/canvas-mocks/landing.jsx, líneas 284-328): tarjeta de
 * perfil docente con 3 barras de rating. Visual puro, sin fetch.
 */
export function DemoProf() {
  return (
    <div
      className="bg-bg text-ink-2"
      style={{ borderRadius: 10, padding: '12px 14px', fontSize: 12 }}
    >
      <div className="flex justify-between" style={{ marginBottom: 10 }}>
        <div>
          <div className="text-ink" style={{ fontWeight: 600, fontSize: 13 }}>
            Federico Brandt
          </div>
          <div className="font-mono text-ink-3" style={{ fontSize: 10.5 }}>
            3 materias · 87 reseñas
          </div>
        </div>
        <div
          className="font-mono text-ink"
          style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          4.1
          <span className="text-ink-3" style={{ fontSize: 11, marginLeft: 2 }}>
            /5
          </span>
        </div>
      </div>
      {RATING_BARS.map((bar) => (
        <div
          key={bar.label}
          className="grid items-center"
          style={{ gridTemplateColumns: '70px 1fr 32px', gap: 8, marginBottom: 5, fontSize: 11 }}
        >
          <span className="text-ink-3">{bar.label}</span>
          <span className="bg-line-2 block overflow-hidden" style={{ height: 5, borderRadius: 3 }}>
            <span
              className="block bg-accent"
              style={{ width: `${bar.value * 100}%`, height: '100%' }}
            />
          </span>
          <span className="font-mono text-ink text-right" style={{ fontSize: 10.5 }}>
            {(bar.value * 5).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
