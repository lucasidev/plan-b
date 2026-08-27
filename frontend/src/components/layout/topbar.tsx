'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlobalSearch } from '@/features/global-search';
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
 * Topbar CTA "Escribir reseña": el acto principal del producto, siempre a un clic desde cualquier
 * pantalla del área autenticada.
 *
 * Sin badge de pendientes. El que había contaba cursadas sin reseñar del modelo anterior, y esa
 * cuenta se retiró con él: un checklist de pendientes contradice el modelo vigente, donde reseñar
 * arranca eligiendo una cursada y no tachando una lista.
 */
function WriteReviewButton() {
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
