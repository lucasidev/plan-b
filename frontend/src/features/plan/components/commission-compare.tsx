import { MOCK_COMMISSION_OPTIONS_INT302 } from '../data/mocks';

/**
 * Comparador de comisiones (US-046). Para una materia dada, muestra las comisiones disponibles
 * con sus insights crowd-sourced (diff, workload, approval, count). Mock que usa el dataset de
 * INT302 como ejemplo; cuando aterrice US-024 (compartir simulación), los insights vienen del
 * corpus real.
 *
 * Renderizado inline en la página (no modal): para la maqueta es más visible y matchea el
 * "Comparar" button del header.
 */
export function CommissionCompare({ subjectCode = 'INT302' }: { subjectCode?: string }) {
  const options = MOCK_COMMISSION_OPTIONS_INT302; // hardcoded a INT302 hasta que aterrice el corpus

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
          Insights del corpus
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
