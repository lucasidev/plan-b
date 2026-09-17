/**
 * Shell layout of the Help page (US-073). Hero on top + 2-col grid with FAQ (left) and
 * a sidebar with contact + resources (right). Server component: the only client part is
 * the FAQ accordion that keeps the open-item state locally.
 */

import { PageFrame } from '@/components/layout/page-frame';
import { ContactCard } from './contact-card';
import { FaqList } from './faq-list';
import { HelpHero } from './help-hero';
import { ResourcesCard } from './resources-card';

export function HelpShell() {
  return (
    <PageFrame
      head={<HelpHero />}
      main={<FaqList />}
      aside={
        <div className="flex min-w-0 flex-col gap-4">
          <ContactCard />
          <ResourcesCard />
        </div>
      }
    />
  );
}
