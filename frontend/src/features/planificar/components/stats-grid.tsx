import type { Simulation } from '../types';

/**
 * Grid de 4 stats agregados del período (US-046). Espejo del canvas v2: weekly hours, choques,
 * dificultad promedio, % aprob esperada. El choque > 0 se renderea con color de warn.
 */
export function StatsGrid({ stats }: { stats: Simulation['stats'] }) {
  const items: Array<{ value: string; label: string; warn?: boolean }> = [
    { value: `${stats.weeklyHours}h`, label: 'semanales' },
    {
      value: `${stats.clashes}`,
      label: stats.clashes === 1 ? 'choque' : 'choques',
      warn: stats.clashes > 0,
    },
    { value: stats.avgDiff.toFixed(1), label: 'dificultad' },
    { value: `${Math.round(stats.expectedApproval * 100)}%`, label: 'aprob. esperada' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-bg-card border border-line rounded-lg"
          style={{ padding: '13px 15px' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: it.warn ? 'var(--accent-ink)' : 'var(--ink-1)',
            }}
          >
            {it.value}
          </div>
          <div className="text-ink-3" style={{ fontSize: 11, marginTop: 4 }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
