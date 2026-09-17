/**
 * Layout shell of the About plan-b page (US-074). Hero on top + 2-column grid with the
 * manifesto + roadmap on the left and team + universities + open source on the
 * right. Server component (all content is static).
 */

import { PageFrame } from '@/components/layout/page-frame';
import { AboutHero } from './about-hero';
import { ManifestoCard } from './manifesto-card';
import { OpenSourceCard } from './open-source-card';
import { RoadmapCard } from './roadmap-card';
import { TeamCard } from './team-card';
import { UniversitiesCard } from './universities-card';

export function AboutShell() {
  return (
    <PageFrame
      head={<AboutHero />}
      main={
        <div className="flex min-w-0 flex-col gap-5">
          <ManifestoCard />
          <RoadmapCard />
        </div>
      }
      aside={
        <div className="flex min-w-0 flex-col gap-5">
          <TeamCard />
          <UniversitiesCard />
          <OpenSourceCard />
        </div>
      }
    />
  );
}
