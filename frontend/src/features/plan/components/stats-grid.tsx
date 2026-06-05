import type { Simulation } from '../types';

/**
 * 4-stat aggregate grid for the period (US-046). Mirrors the v2 canvas: weekly hours,
 * clashes, average difficulty, expected approval %. A clash > 0 renders with the warn
 * color.
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
