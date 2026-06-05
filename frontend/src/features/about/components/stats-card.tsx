/**
 * Stats card en grid 2x2. Hardcoded en MVP (alumnos, reseñas, docentes, versión). Cuando
 * aterrice `GET /api/stats/public` (US separada), este componente pasa a RSC con fetch.
 */

import { ABOUT_STATS } from '../data/content';
import { Card, EyebrowLabel } from './shared';

const STATS: ReadonlyArray<{ key: keyof typeof ABOUT_STATS; label: string }> = [
  { key: 'students', label: 'alumnos' },
  { key: 'reviews', label: 'reseñas' },
  { key: 'teachers', label: 'docentes' },
  { key: 'version', label: 'versión' },
];

export function StatsCard() {
  return (
    <Card>
      <EyebrowLabel>Números</EyebrowLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginTop: 14,
        }}
      >
        {STATS.map((s) => (
          <div key={s.key}>
            <div
              className="text-ink-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {ABOUT_STATS[s.key]}
            </div>
            <div className="text-ink-3" style={{ fontSize: 12, marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
