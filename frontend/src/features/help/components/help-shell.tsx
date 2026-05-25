/**
 * Shell layout de la página Ayuda (US-073). Hero arriba + grid 2 col con FAQ (izq) y sidebar
 * de contacto + recursos (der). Server component: la única parte cliente es el FAQ accordion
 * que mantiene state local del item abierto.
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
