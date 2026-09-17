/**
 * Shared primitives across the About page cards (US-074). Card box + mono uppercase
 * eyebrow. Centralised so every card has the same padding/border/radius without
 * duplicating tokens in each component.
 */

import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <section className="pb-card flex min-w-0 flex-col">{children}</section>;
}

export function EyebrowLabel({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-xl font-semibold text-ink">{children}</h2>;
}
