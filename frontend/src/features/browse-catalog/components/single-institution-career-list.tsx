import Link from 'next/link';
import type { CareerCoverage } from '../types';

/** Cuántas filas compactas mostrar antes del "Se muestran N de K" (ADR-0096, maqueta aprobada). */
const VISIBLE_COUNT = 12;

/**
 * "En una sola institución" (US-222, ADR-0096, maqueta aprobada): el resto del catálogo, lo que no
 * comparte carrera canónica con nadie más. `careers` ya llega alfabético por nombre de carrera
 * (US-171, `groupCareersByCanonical`); acá solo se recortan las primeras doce, sin pill por fila
 * (eso vivía en `CareerReviewsPill`: en una lista de cientos, "sin reseñas todavía" repetido en
 * casi todas las filas no suma nada que el eyebrow de la sección no diga ya).
 */
export function SingleInstitutionCareerList({
  careers,
  universityShortNames,
}: {
  careers: CareerCoverage[];
  universityShortNames: ReadonlyMap<string, string>;
}) {
  if (careers.length === 0) {
    return null;
  }

  const visible = careers.slice(0, VISIBLE_COUNT);

  return (
    <section aria-labelledby="single-institution-heading">
      <h2
        id="single-institution-heading"
        className="font-display text-[16px] font-semibold text-ink"
      >
        En una sola institución
      </h2>
      <p className="mt-0.5 text-[12px] text-ink-3">
        {careers.length} {careers.length === 1 ? 'carrera' : 'carreras'}
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {visible.map((career) => (
          <li key={career.careerId}>
            <Link
              href={`/careers/${career.careerId}`}
              prefetch={false}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-bg-elev"
            >
              <span className="min-w-0 font-medium text-ink">{career.careerName}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-3">
                {universityShortNames.get(career.universityId) ?? career.universityName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {careers.length > VISIBLE_COUNT && (
        <p className="mt-2 font-mono text-[11px] text-ink-3">
          Se muestran {VISIBLE_COUNT} de {careers.length}. Buscá la tuya con ⌘K.
        </p>
      )}
    </section>
  );
}
