/**
 * Roadmap card: 3 bloques temporales (ahora / próximo mes / más adelante). El "when" va en
 * mono uppercase a la izquierda; el "what" en texto regular a la derecha.
 */

import { ABOUT_ROADMAP } from '../data/content';
import { Card, EyebrowLabel } from './shared';

export function RoadmapCard() {
  return (
    <Card>
      <EyebrowLabel>Lo que viene</EyebrowLabel>
      <dl
        style={{
          margin: '14px 0 0',
          display: 'grid',
          gridTemplateColumns: 'minmax(110px, max-content) 1fr',
          rowGap: 12,
          columnGap: 18,
        }}
      >
        {ABOUT_ROADMAP.map((item) => (
          <div key={item.when} style={{ display: 'contents' }}>
            <dt
              className="text-accent"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                paddingTop: 3,
              }}
            >
              {item.when}
            </dt>
            <dd className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {item.what}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
