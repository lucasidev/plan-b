import Link from 'next/link';
import type { CareerCoverage } from '../types';

/** Cuántas filas compactas mostrar antes del "Se muestran N de K" (ADR-0096, maqueta aprobada). */
const VISIBLE_COUNT = 12;

/**
 * "En una sola institución" (US-222, ADR-0096, maqueta aprobada): el resto del catálogo, lo que no
 * comparte carrera canónica con nadie más. `careers` ya llega alfabético por nombre de carrera
 * (US-171, `groupCareersByCanonical`); acá solo se recortan las primeras doce. Todas las filas van
 * atenuadas (`.pb-row.pb-dim`, como en la maqueta) y sin pill: en una lista de cientos, un estado
 * de reseñas por fila no suma nada que el resto de Explorar no diga ya. La institución va como
 * texto simple (`.pb-meta`), no como link: la fila entera ya lleva a esa carrera.
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
    <section className="pb-section" aria-labelledby="single-institution-heading">
      <h2 id="single-institution-heading" className="pb-eyebrow">
        En una sola institución · {careers.length} {careers.length === 1 ? 'carrera' : 'carreras'}
      </h2>
      <ul className="pb-list" style={{ gap: 4 }}>
        {visible.map((career) => (
          <li key={career.careerId}>
            <Link
              href={`/careers/${career.careerId}`}
              prefetch={false}
              className="pb-row pb-dim"
              style={{ padding: '7px 12px' }}
            >
              <span>
                <span className="pb-name" style={{ fontSize: 13 }}>
                  {career.careerName}
                </span>
              </span>
              <span className="pb-right">
                <span className="pb-meta">
                  {universityShortNames.get(career.universityId) ?? career.universityName}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {careers.length > VISIBLE_COUNT && (
        <p className="pb-meta" style={{ marginTop: 8 }}>
          Se muestran {VISIBLE_COUNT} de {careers.length}. Buscá la tuya con ⌘K.
        </p>
      )}
    </section>
  );
}
