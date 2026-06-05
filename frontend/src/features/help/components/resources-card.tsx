/**
 * Resources card (US-073). Four items from the mockup; the first three are placeholders
 * with no real destination (debt documented in `data/resources.ts`). The last one
 * ("Estado del servicio") shows an inline ✓ to mean "all OK" while there is no real
 * status page.
 */

import { ArrowUpRight, Check } from 'lucide-react';
import { HELP_RESOURCES, type ResourceLink } from '../data/resources';

export function ResourcesCard() {
  return (
    <section
      className="bg-bg-card border border-line"
      style={{ padding: 18, borderRadius: 10 }}
      aria-labelledby="resources-heading"
    >
      <h2
        id="resources-heading"
        className="text-ink-1"
        style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}
      >
        Recursos
      </h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {HELP_RESOURCES.map((r) => (
          <li key={r.label}>
            <ResourceRow resource={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResourceRow({ resource }: { resource: ResourceLink }) {
  const isPending = resource.status === 'pending';
  const isOk = resource.status === 'ok';

  return (
    <div
      className={isPending ? 'text-ink-3' : 'text-ink-2 hover:text-ink-1'}
      style={{
        padding: '10px 0',
        fontSize: 13.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '1px solid var(--line)',
      }}
      title={isPending ? 'Próximamente' : undefined}
    >
      <span>{resource.label}</span>
      {isOk && <Check size={14} aria-label="OK" className="text-st-approved-fg" />}
      {isPending && <ArrowUpRight size={14} aria-hidden style={{ opacity: 0.4 }} />}
    </div>
  );
}
