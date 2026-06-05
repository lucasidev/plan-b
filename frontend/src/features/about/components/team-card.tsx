/**
 * Team card. MVP: Lucas as the sole author, with the UNSTA + Ing. Copas academic
 * context as a separate footnote (not co-author). The mockup showed 3 canvas examples;
 * the reality here is just one. When external contributors join, they are added to the
 * array.
 */

import { ABOUT_ACADEMIC_CONTEXT, ABOUT_TEAM } from '../data/content';
import { Card, EyebrowLabel } from './shared';

export function TeamCard() {
  return (
    <Card>
      <EyebrowLabel>Equipo</EyebrowLabel>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '14px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {ABOUT_TEAM.map((member) => (
          <li key={member.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden
              className="bg-accent-soft text-accent-ink grid place-items-center font-semibold"
              style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 13, flexShrink: 0 }}
            >
              {member.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="text-ink-1" style={{ fontSize: 14, fontWeight: 500 }}>
                {member.name}
              </div>
              <div className="text-ink-3" style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                {member.role}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p
        className="text-ink-4"
        style={{
          fontSize: 11.5,
          lineHeight: 1.5,
          marginTop: 16,
          borderTop: '1px solid var(--line)',
          paddingTop: 12,
        }}
      >
        {ABOUT_ACADEMIC_CONTEXT}
      </p>
    </Card>
  );
}
