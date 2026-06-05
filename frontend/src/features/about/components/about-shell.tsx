/**
 * Layout shell of the About plan-b page (US-074). Hero on top + 2-column grid with the
 * manifesto + roadmap on the left and team + stats + universities + open source on the
 * right. Server component (all content is static).
 */

import { AboutHero } from './about-hero';
import { ManifestoCard } from './manifesto-card';
import { OpenSourceCard } from './open-source-card';
import { RoadmapCard } from './roadmap-card';
import { StatsCard } from './stats-card';
import { TeamCard } from './team-card';
import { UniversitiesCard } from './universities-card';

export function AboutShell() {
  return (
    <div className="bg-bg" style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AboutHero />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ManifestoCard />
            <RoadmapCard />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <TeamCard />
            <StatsCard />
            <UniversitiesCard />
            <OpenSourceCard />
          </div>
        </div>
      </div>
    </div>
  );
}
