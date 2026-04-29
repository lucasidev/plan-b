'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { breadcrumbsForPath } from '@/lib/member-shell';

/**
 * Topbar del área `(member)` per `docs/design/reference/components/shell.jsx::Topbar`.
 *
 * Cliente porque deriva los breadcrumbs de `usePathname()`. La search bar
 * está visible per AC pero NO funcional (deuda explícita de US-042-f a una
 * US futura de búsqueda global). Click no hace nada por ahora.
 *
 * El botón "＋ Escribir reseña" del slot derecho linkea a `/reviews/new`,
 * que hoy es un stub (aterriza con US-017). Per mockup `plan-b.html`
 * líneas 146-156: el botón vive siempre en la topbar, accesible desde
 * cualquier vista del área autenticada.
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
      <SearchBar />
      <WriteReviewButton />
    </div>
  );
}

function WriteReviewButton() {
  return (
    <Link
      href="/reviews/new"
      prefetch
      className={
        'inline-flex items-center gap-1.5 bg-ink text-white border border-ink rounded-pill shadow-card transition-colors hover:bg-[#1a110a] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft'
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

  return (
    <div
      className="text-ink-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        letterSpacing: '0.02em',
      }}
    >
      {items.map((crumb, i) => {
        const isLast = i === items.length - 1;
        // The breadcrumb sequence is stable for a given pathname (derived
        // from the route map). Using `crumb` alone is enough because two
        // crumbs never repeat within a single breadcrumb chain.
        return (
          <Fragment key={crumb}>
            {i > 0 && <span style={{ margin: '0 6px', color: 'var(--color-ink-4)' }}>/</span>}
            {isLast ? (
              <b className="text-ink" style={{ fontWeight: 500 }}>
                {crumb}
              </b>
            ) : (
              <span>{crumb}</span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * Visual placeholder para la búsqueda global (`⌘K`). El input no envía
 * a ningún endpoint todavía. El submit del form (Enter) hace
 * `preventDefault` para no recargar la página.
 *
 * Cuando aterrice US-004 (search backend) + la US frontend de search
 * global, este componente se reemplaza por uno con `Combobox` real.
 */
function SearchBar() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex items-center bg-bg-card border border-line rounded-pill shadow-card"
      style={{ padding: '7px 14px', gap: 6, width: 320 }}
    >
      <Search size={13} className="text-ink-3" aria-hidden />
      <input
        type="search"
        placeholder="Buscar materia, docente, código..."
        aria-label="Buscar"
        className="flex-1 bg-transparent border-0 outline-none text-ink"
        style={{ font: 'inherit', fontSize: 13 }}
      />
      <kbd
        className="text-ink-3 bg-bg-card border border-line"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          padding: '1px 5px',
          borderRadius: 3,
        }}
      >
        ⌘K
      </kbd>
    </form>
  );
}
