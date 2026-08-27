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
 * Client because it derives breadcrumbs from `usePathname()`.
 *
 * La barra de búsqueda funciona: pega a `GET /api/search` y encuentra materias, docentes y
 * cátedras. El comentario que decía acá que era un stub sin función quedó de US-042-f y siguió
 * escrito mucho después de que la búsqueda aterrizara.
 *
 * El botón "+ Escribir reseña" del slot derecho lleva a `/reviews/new`, la pantalla de reseñar
 * una cursada (US-146, ADR-0082). Vive siempre en el topbar y se llega desde cualquier vista del
 * área autenticada: reseñar es el acto principal del producto, no una pantalla escondida.
 *
 * El badge cuenta cursadas pendientes de reseñar, que es una lectura del modelo anterior; se
 * rehace cuando esa cuenta salga del modelo nuevo.
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
 * El link va a `/reviews/new`, que es reseñar una cursada eligiéndola a mano. El badge sigue
 * contando pendientes del modelo anterior y se rehace cuando esa cuenta salga del modelo nuevo.
 *
 * La data la siembra el layout de `(member)` (prefetch + HydrationBoundary con este mismo
 * queryKey), así que el badge sale bien desde el primer paint.
 *
 * El flag `mounted` se queda igual, y no es redundante: `enabled` no afecta la lectura de la
 * cache hidratada, pero sí impide que el queryFn corra server-side si algún día el prefetch del
 * layout no está (falla, o alguien monta el topbar en otro lado). Ese queryFn usa un path relativo
 * `/api/...` que en Node no resuelve, y su fallo rompía la RSC de la página a la que se estaba
 * navegando. Hydration-safe: server y primer render de cliente ven enabled=false.
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
      href="/reviews/new"
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
