/**
 * Roadmap card: 3 time-frame blocks (now / next month / later). The "when" goes in mono
 * uppercase on the left; the "what" in regular text on the right.
 */

import { ABOUT_ROADMAP } from '../data/content';
import { Card, EyebrowLabel } from './shared';

export function RoadmapCard() {
  return (
    <Card>
      <EyebrowLabel>Lo que viene</EyebrowLabel>
      <dl className="mt-4 flex flex-col gap-4">
        {ABOUT_ROADMAP.map((item) => (
          <div key={item.when} className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
            <dt className="pb-eyebrow pt-0.5">{item.when}</dt>
            <dd className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {item.what}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
