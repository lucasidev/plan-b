import Link from 'next/link';

export type CrumbItem = {
  label: string;
  /** Sin href = crumb actual (no clickeable, en negrita). */
  href?: string;
};

/**
 * Breadcrumb del catálogo público (US-001): cadena "← Universidades / {uni} / {carrera} / {plan}"
 * hacia arriba en la jerarquía. Cada page arma sus propios `items` con lo que efectivamente pudo
 * resolver (ver comentario en `app/(public)/careers/[id]/plans/page.tsx` sobre el nivel que no
 * puede resolver nombre de carrera/universidad con los endpoints públicos actuales).
 */
export function CatalogBreadcrumb({ items }: { items: CrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Ruta de navegación"
      className="font-mono text-[11px] tracking-[0.02em] text-ink-3"
    >
      <span aria-hidden>← </span>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <b className="font-semibold text-ink">{item.label}</b>
            )}
            {!isLast && <span className="mx-1.5 text-ink-4">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
