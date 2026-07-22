import { MOCK_COMMISSION_OPTIONS_INT302 } from '../data/mocks';

/**
 * Comparador de comisiones (US-046). Muestra las comisiones de una materia con sus métricas
 * (dificultad, carga, aprobación, cantidad de reseñas).
 *
 * Los números todavía salen de un dataset fijo: el corpus real llega con US-024. Hasta entonces el
 * rótulo tiene que decirlo. Antes decía "Insights del corpus", que afirmaba exactamente lo que no
 * era: el resto de la app puede mostrar datos incompletos, pero ninguna otra parte le atribuía a un
 * dato inventado un origen que no tenía.
 *
 * Se renderiza inline en la página (no modal): más visible y matchea el botón "Comparar" del header.
 */
export function CommissionCompare({ subjectCode = 'INT302' }: { subjectCode?: string }) {
  const options = MOCK_COMMISSION_OPTIONS_INT302; // hardcoded to INT302 until the corpus lands

  return (
    <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
          Comparar comisiones · {subjectCode}
        </h2>
        <small className="text-ink-3" style={{ fontWeight: 400 }}>
          Datos de ejemplo
        </small>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {options.map((opt) => (
          <div key={opt.com} className="border border-line rounded" style={{ padding: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <div
                className="text-ink-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                com {opt.com}
              </div>
              <small className="text-ink-4" style={{ fontSize: 10.5 }}>
                {opt.insights.reviewsCount} reseñas
              </small>
            </div>
            <div className="text-ink-2" style={{ fontSize: 12, marginBottom: 2 }}>
              {opt.prof}
            </div>
            <div className="text-ink-3" style={{ fontSize: 11, marginBottom: 10 }}>
              {opt.schedule}
            </div>
            <Insight label="dificultad" value={opt.insights.diff.toFixed(1)} />
            <Insight label="carga semanal" value={`${opt.insights.workload}h`} />
            <Insight label="aprob. esp." value={`${Math.round(opt.insights.approval * 100)}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11.5,
        padding: '3px 0',
      }}
    >
      <span className="text-ink-3">{label}</span>
      <span className="text-ink-1" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
