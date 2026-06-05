/**
 * List of supported universities. Hardcoded in MVP. When
 * `GET /api/universities/public` lands (US-074 debt), the list comes from the backend
 * with a 24h cache.
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
