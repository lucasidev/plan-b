/**
 * Shell layout of the Help page (US-073). Hero on top + 2-col grid with FAQ (left) and
 * a sidebar with contact + resources (right). Server component: the only client part is
 * the FAQ accordion that keeps the open-item state locally.
 */

import { ContactCard } from './contact-card';
import { FaqList } from './faq-list';
import { HelpHero } from './help-hero';
import { ResourcesCard } from './resources-card';

export function HelpShell() {
  return (
    <div className="py-6">
      <HelpHero />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <FaqList />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ContactCard />
          <ResourcesCard />
        </div>
      </div>
    </div>
  );
}
