import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { InlineStars, Pill } from '@/components/ui';
import type { Decision } from '../data/mock-decisions';

/**
 * Card de decisión del home. Port literal del mockup
 * `screens.jsx::DecisionCard`. Layout: número monoespaciado arriba a la
 * izquierda, pill de tono arriba a la derecha (si aplica), título display,
 * body explicativo, action button al pie.
 *
 * El action es un Link a `actionHref` (no un onClick handler) para que
 * funcione con prefetch y server-side navigation. Cuando aterricen las
 * features destino (US-016, US-002, US-003) los hrefs ya están
 * apuntando bien.
 */
export function DecisionCard({ decision }: { decision: Decision }) {
  const { num, title, body, action, actionHref, tone } = decision;
  return (
    <article
      className="bg-bg-card border border-line shadow-card flex flex-col"
      style={{ padding: 24, borderRadius: 'var(--radius)', gap: 10 }}
    >
      <header className="flex items-start justify-between">
        <span
          className="text-ink-4"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
          }}
        >
          {num}
        </span>
        {tone && <Pill tone={tone}>{tone === 'danger' ? 'urgente' : 'requiere atención'}</Pill>}
      </header>

      <h3
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          margin: 0,
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h3>

      <p className="text-ink-2" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
        <InlineStars>{body}</InlineStars>
      </p>

      <div style={{ marginTop: 6 }}>
        <Link
          href={actionHref}
          prefetch
          className="inline-flex items-center gap-1.5 bg-bg-card text-ink border border-line rounded-pill shadow-card transition-colors hover:bg-bg-elev focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 500 }}
        >
          {action}
          <ArrowRight size={12} aria-hidden strokeWidth={2.25} className="text-ink-3" />
        </Link>
      </div>
    </article>
  );
}
