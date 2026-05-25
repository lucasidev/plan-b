/**
 * Shell layout de la página Sobre plan-b (US-074). Hero arriba + grid 2 col con manifiesto
 * + roadmap a la izquierda, team + stats + universidades + open source a la derecha.
 * Server component (todo el contenido es estático).
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
