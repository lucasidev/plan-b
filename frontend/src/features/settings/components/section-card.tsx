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
    <section className="bg-bg border border-line rounded-lg overflow-hidden">
      <header className="px-6 py-4 border-b border-line">
        <h2 className="text-base font-semibold text-ink-1">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </header>
      <div className="px-6 divide-y divide-line">{children}</div>
    </section>
  );
}
