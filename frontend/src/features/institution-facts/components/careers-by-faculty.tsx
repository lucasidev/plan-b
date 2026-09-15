import { FallbackLink } from '@/components/layout/fallback-link';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from '../lib/describe-institution-careers';
import { groupCareersByFaculty } from '../lib/group-careers-by-faculty';

/**
 * "Facultades y carreras" (SC-005, `V.university().main` línea 488 de la maqueta aprobada): TODAS
 * las carreras de la institución agrupadas por facultad, cada una con link a su ficha y cuántas
 * reseñas junta (`describeCareerReviews`). Muestra oficiales y crowdsourced (US-088): las no
 * oficiales llevan la marca "No oficial" en vez de ocultarse. El orden lo decide
 * `groupCareersByFaculty` (facultades y carreras con reseñas primero).
 */
export function CareersByFaculty({
  careers,
  coverage,
}: {
  careers: Career[];
  coverage: CareerCoverage[];
}) {
  const coverageByCareerId = new Map(coverage.map((c) => [c.careerId, c]));
  const groups = groupCareersByFaculty(careers, coverage);

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Facultades y carreras</div>
      {careers.length === 0 ? (
        <p className="pb-muted" style={{ fontSize: 13 }}>
          Esta universidad todavía no tiene carreras cargadas.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.name} className="pb-card" style={{ marginBottom: 10 }}>
            <h3 className="pb-serif" style={{ fontSize: 17, marginBottom: 8 }}>
              {group.name}
            </h3>
            <div className="pb-list" style={{ gap: 4 }}>
              {group.careers.map((career) => {
                const reviews = describeCareerReviews(coverageByCareerId.get(career.id));
                const hasReviews = reviews !== null;
                return (
                  <FallbackLink
                    key={career.id}
                    href={`/careers/${career.id}`}
                    // Sin prefetch: ver el porqué en subject-grid.tsx.
                    prefetch={false}
                    style={{
                      padding: '8px 10px',
                      border: 0,
                      background: hasReviews ? 'var(--color-bg-elev)' : 'transparent',
                    }}
                    className={hasReviews ? 'pb-row' : 'pb-row pb-dim'}
                  >
                    <span className="pb-name" style={{ fontSize: 13.5 }}>
                      {career.name}
                      {!career.isOfficial && (
                        <span className="pb-pill" style={{ marginLeft: 6 }}>
                          No oficial
                        </span>
                      )}
                    </span>
                    <span className="pb-right">
                      {hasReviews && <span className="pb-pill pb-pub">{reviews}</span>}
                    </span>
                  </FallbackLink>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
