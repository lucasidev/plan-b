/**
 * Shared primitives across the About page cards (US-074). Card box + mono uppercase
 * eyebrow. Centralised so every card has the same padding/border/radius without
 * duplicating tokens in each component.
 */

import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return (
    <section
      className="bg-bg-card border border-line"
      style={{
        padding: 22,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </section>
  );
}

export function EyebrowLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-ink-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}
