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
    <section className="pb-card" aria-labelledby="resources-heading">
      <h2 id="resources-heading" className="mb-3 font-serif text-xl font-semibold text-ink">
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
      className="text-ink-3"
      style={{
        padding: '10px 0',
        fontSize: 13.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderBottom: '1px solid var(--color-line-2)',
      }}
      title={isPending ? 'Próximamente' : undefined}
    >
      <span>{resource.label}</span>
      {isOk && <Check size={14} aria-label="OK" className="shrink-0 text-ink-2" />}
      {isPending && <ArrowUpRight size={14} aria-hidden className="shrink-0" />}
    </div>
  );
}
