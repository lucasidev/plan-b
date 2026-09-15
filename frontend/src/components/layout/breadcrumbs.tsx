import Link from 'next/link';
import { Fragment } from 'react';
import './planb.css';

/**
 * Una miga del topbar: sin `href` es la activa (última, en negrita, nunca clickeable). Distinto de
 * `CrumbItem` de `features/browse-catalog/components/breadcrumb.tsx` (ese breadcrumb vive adentro
 * del contenido, no en el topbar, y decide el link por presencia de `href` en cualquier posición,
 * no por ser o no la última).
 */
export type Crumb = {
  label: string;
  href?: string;
  /** Trunca ese segmento con ellipsis (US-129/US-147): la carrera no tiene nombre corto en el
   * backend y va entera, así que sin esto un nombre largo hace crecer el alto del topbar. */
  truncate?: boolean;
};

/**
 * Migas del topbar (`frameApp` línea 640 y `crumbs()` 418-424 de la maqueta aprobada): con una
 * sola, `.pb-where`; con más, `.pb-crumbs` con separadores y la última en negrita.
 */
export function Breadcrumbs({ items }: { items: ReadonlyArray<Crumb> }) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <span className="pb-where">
        <b>
          <CrumbLabel crumb={items[0]} />
        </b>
      </span>
    );
  }

  return (
    <nav className="pb-crumbs" aria-label="Dónde estás">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={item.label}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {isLast ? (
              <b>
                <CrumbLabel crumb={item} />
              </b>
            ) : item.href ? (
              <Link href={item.href} prefetch={false}>
                <CrumbLabel crumb={item} />
              </Link>
            ) : (
              <span>
                <CrumbLabel crumb={item} />
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

function CrumbLabel({ crumb }: { crumb: Crumb }) {
  if (!crumb.truncate) return <>{crumb.label}</>;

  return (
    <span
      style={{
        display: 'inline-block',
        maxWidth: 260,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
      }}
    >
      {crumb.label}
    </span>
  );
}
