import Link from 'next/link';

/**
 * El cierre de la ficha de institución (SC-005): el llamado a reseñar. Es la única salida de una
 * institución sin datos todavía, así que va siempre al pie, no solo cuando falta algo puntual.
 *
 * Sin el conteo de "N carreras sin datos" del boceto: ese read agregado (cobertura por lote) no
 * existe todavía, y el llamado funciona igual sin el número.
 */
export function ReviewCta({ href }: { href: string }) {
  return (
    <section className="rounded-xl border border-line bg-bg-card p-4">
      <p className="mb-1 text-[14px] text-ink">¿Estudiás acá?</p>
      <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
        Todavía hay carreras sin datos. La tuya puede ser la próxima.
      </p>
      <Link
        href={href}
        className="block rounded-lg bg-ink px-3.5 py-[9px] text-center text-[13px] font-medium text-bg-card"
      >
        Reseñá tu cursada
      </Link>
    </section>
  );
}
