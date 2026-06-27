'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GlobalSearch } from '@/features/global-search';
import { pendingReviewsQueries } from '@/features/pending-reviews';
import { breadcrumbsForPath } from '@/lib/member-shell';

/**
 * `(member)` area topbar per `docs/design/reference/components/shell.jsx::Topbar`.
 *
 * Client because it derives breadcrumbs from `usePathname()`. The search bar is
 * visible per AC but NOT functional (explicit debt from US-042-f to a future
 * global-search US). Click does nothing for now.
 *
 * The "+ Escribir reseña" button in the right slot links to `/reviews/new`, which is
 * today a stub (lands with US-017). Per the `plan-b.html` mockup lines 146-156: the
 * button always lives in the topbar, accessible from any view of the authenticated
 * area.
 */
export function Topbar() {
  const pathname = usePathname();
  const crumbs = breadcrumbsForPath(pathname);

  return (
    <div
      className="flex items-center bg-bg border-b border-line"
      style={{ height: 56, padding: '0 24px', gap: 16, flexShrink: 0 }}
    >
      <Crumbs items={crumbs} />
      <div className="flex-1" />
      <GlobalSearch />
      <WriteReviewButton />
    </div>
  );
}

/**
 * Topbar CTA "Escribir reseña". Per the US-048 AC, when the student has pending
 * cursadas the button shows an accent badge with the count. Lookup is a background
 * `useQuery` so the topbar mounts immediately and the badge fades in once the data
 * arrives. We don't suspend: blocking the whole shell on this read would be a
 * regression every page.
 *
 * The link points to `/reviews?tab=pending`: that is the natural source ("pick the
 * cursada to review"). When there are no pendings the user lands on the empty state
 * and the badge disappears.
 *
 * Client-only fetch: the topbar lives in the member layout, outside any page's RSC
 * prefetch + HydrationBoundary, so this query is never hydrated. The queryFn uses a
 * relative URL (`/api/...`) that only resolves in the browser. Under
 * ReactQueryStreamedHydration a plain useQuery would otherwise execute server-side during
 * SSR and throw "Failed to parse URL" (no base, no cookie), which intermittently broke the
 * RSC render of the page being navigated to. Gating on a mounted flag keeps the fetch on
 * the client. Hydration-safe: server and the first client render both see enabled=false
 * (no badge); the effect flips it after mount.
 */
function WriteReviewButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data } = useQuery({
    ...pendingReviewsQueries.list(),
    staleTime: 30 * 1000,
    enabled: mounted,
  });
  const count = data?.items.length ?? 0;

  return (
    <Link
      href="/reviews?tab=pending"
      prefetch
      className={
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap bg-ink text-white border border-ink rounded-pill shadow-card transition-colors hover:bg-[#1a110a] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft'
      }
      style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 500 }}
    >
      <Plus size={13} aria-hidden />
      Escribir reseña
      {count > 0 && (
        <>
          <span className="sr-only">{`${count} cursadas pendientes`}</span>
          <span
            aria-hidden
            className="bg-accent text-white"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              padding: '1px 6px',
              borderRadius: 999,
              marginLeft: 2,
            }}
          >
            {count}
          </span>
        </>
      )}
    </Link>
  );
}

function Crumbs({ items }: { items: ReadonlyArray<string> }) {
  if (items.length === 0) return null;

  // El crumb activo (último) siempre se muestra; los de sección (prefijo) se ocultan en viewports
  // angostos (< lg) para que el activo no se trunque a media palabra. min-w-0 + truncate quedan
  // como red de seguridad si hasta el activo no entra: una sola línea, nunca wrap (lo que rompía
  // el alto fijo de 56px del topbar). El sequence es estable por pathname, así que `crumb` como key
  // alcanza (nunca se repiten dentro de una cadena).
  const active = items[items.length - 1];
  const prefix = items.slice(0, -1);

  return (
    <div
      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-ink-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        letterSpacing: '0.02em',
      }}
    >
      {prefix.map((crumb) => (
        <span key={crumb} className="hidden lg:inline">
          {crumb}
          <span style={{ margin: '0 6px', color: 'var(--color-ink-4)' }}>/</span>
        </span>
      ))}
      <b className="text-ink" style={{ fontWeight: 500 }}>
        {active}
      </b>
    </div>
  );
}
