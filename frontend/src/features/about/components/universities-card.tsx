/**
 * Lista de universidades soportadas. Hardcoded en MVP. Cuando aterrice
 * `GET /api/universities/public` (deuda US-074), la lista sale del backend con cache 24h.
 */

import { ABOUT_UNIVERSITIES } from '../data/content';
import { Card, EyebrowLabel } from './shared';

export function UniversitiesCard() {
  return (
    <Card>
      <EyebrowLabel>Universidades</EyebrowLabel>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '14px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {ABOUT_UNIVERSITIES.map((u) => (
          <li key={u} className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
            {u}
          </li>
        ))}
      </ul>
    </Card>
  );
}
