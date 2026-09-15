import Link from 'next/link';
import { Fragment } from 'react';
import './planb.css';

/**
 * Una miga del topbar: sin `href` es la activa (última, en negrita, nunca clickeable). Distinto de
 * `CrumbItem` de `features/browse-catalog/components/breadcrumb.tsx` (ese breadcrumb vive adentro
 * del contenido, no en el topbar, y decide el link por presencia de `href` en cualquier posición,
 * no por ser o no la última).
 *
 * `truncate` marca el segmento de la carrera (la única miga sin nombre corto en el backend): a
 * diferencia del resto, que hace wrap en vez de recortarse, esa se corta con ellipsis y el nombre
 * completo va al `title`, para que la cadena entera entre en dos líneas a 1280px.
 */
export type Crumb = {
  label: string;
  href?: string;
  truncate?: boolean;
};

/**
 * Migas del topbar (`frameApp` línea 640 y `crumbs()` 418-424 de la maqueta aprobada): con una
 * sola, `.pb-where`; con más, `.pb-crumbs` con separadores y la última en negrita. `.pb-crumbs`
 * hace wrap (línea 88 de la maqueta): un segmento largo baja a su propia línea en vez de
 * recortarse, salvo el de la carrera (`truncate`), que se recorta en vez de estirar el topbar a
 * tres líneas cuando conviven con una materia o una cátedra.
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
        const className = item.truncate ? 'pb-crumb-truncate' : undefined;
        const title = item.truncate ? item.label : undefined;
        return (
          <Fragment key={item.label}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {isLast ? (
              <b className={className} title={title}>
                {item.label}
              </b>
            ) : item.href ? (
              <Link href={item.href} prefetch={false} className={className} title={title}>
                {item.label}
              </Link>
            ) : (
              <span className={className} title={title}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
