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
};

/**
 * Migas del topbar (`frameApp` línea 640 y `crumbs()` 418-424 de la maqueta aprobada): con una
 * sola, `.pb-where`; con más, `.pb-crumbs` con separadores y la última en negrita. `.pb-crumbs`
 * hace wrap (línea 88 de la maqueta): un segmento largo (la carrera no tiene nombre corto en el
 * backend) baja a su propia línea en vez de recortarse.
 */
export function Breadcrumbs({ items }: { items: ReadonlyArray<Crumb> }) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <span className="pb-where">
        <b>{items[0].label}</b>
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
              <b>{item.label}</b>
            ) : item.href ? (
              <Link href={item.href} prefetch={false}>
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
