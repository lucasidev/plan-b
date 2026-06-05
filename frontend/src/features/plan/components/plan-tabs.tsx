'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export type TabId = 'active' | 'draft';

type TabItem = {
  id: TabId;
  label: string;
  tag?: string;
};

/**
 * URL-driven Plan tabs (US-046). Canonical state in `?tab=active|draft`. If the query
 * param is missing, the default is "active". Visual aligned with the v2 canvas
 * (V2Tabs).
 */
export function PlanTabs({ items, active }: { items: TabItem[]; active: TabId }) {
  const searchParams = useSearchParams();

  return (
    <nav
      style={{
        display: 'flex',
        gap: 18,
        borderBottom: '1px solid var(--line)',
        marginBottom: 24,
      }}
      aria-label="Vistas de Planificar"
    >
      {items.map((it) => {
        const isActive = it.id === active;
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', it.id);
        return (
          <Link
            key={it.id}
            href={`?${params.toString()}`}
            scroll={false}
            style={{
              padding: '10px 0',
              fontSize: 13.5,
              color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {it.label}
            {it.tag && (
              <span
                className="text-ink-3"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  background: 'var(--bg-elev, var(--bg))',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                {it.tag}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
