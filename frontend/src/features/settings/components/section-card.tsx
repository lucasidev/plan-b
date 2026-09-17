import type { ReactNode } from 'react';

/**
 * Section card of Ajustes. Header with title + optional description, body that
 * renders the rows with a divider between each.
 */
type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: Props) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-line bg-bg-card">
      <header className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </header>
      <div className="divide-y divide-line-2 px-4 sm:px-5">{children}</div>
    </section>
  );
}
