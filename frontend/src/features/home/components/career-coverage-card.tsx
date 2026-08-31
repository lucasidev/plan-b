import Link from 'next/link';
import type { CareerFacts } from '@/features/career-facts/types';

/**
 * La cobertura de la carrera declarada (US-231). Es el contexto que sostiene a la lista de arriba
 * cuando las reseñas propias parecen nada: dos reseñas tuyas no mueven un plan, pero el plan se
 * está moviendo.
 *
 * Es la misma cobertura que publica la ficha de la carrera (US-134), no una segunda definición:
 * sale del mismo endpoint, leído para la carrera de esta cuenta.
 *
 * **El número es del plan, no de la cuenta.** Nada acá se presenta como progreso ni logro propio:
 * eso sería un puntaje personal, que es ADR-0083 llevado al perfil.
 */
export function CareerCoverageCard({ facts }: { facts: CareerFacts }) {
  const remaining = facts.totalSubjects - facts.coveredSubjects;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Cuánto de tu carrera está medido</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[14px] text-ink">
            {facts.coveredSubjects} de {facts.totalSubjects}{' '}
            {facts.totalSubjects === 1 ? 'materia' : 'materias'}
          </span>
          <span className="font-mono text-[12.5px] text-ink-2">{facts.coveragePercent} %</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-[3px] bg-bg-elev">
          <div
            className="h-full rounded-[3px] bg-ink"
            style={{ width: `${facts.coveragePercent}%` }}
          />
        </div>

        <p className="mt-2.5 text-[12px] leading-relaxed text-ink-3">{note(facts, remaining)}</p>

        <Link
          href={`/careers/${facts.careerId}`}
          className="mt-3 inline-block text-[12.5px] text-accent-ink underline-offset-2 hover:underline"
        >
          Ver la ficha de {facts.careerName}
        </Link>
      </div>
    </section>
  );
}

function note(facts: CareerFacts, remaining: number): string {
  if (facts.totalSubjects === 0) {
    return 'Todavía no tenemos materias cargadas para esta carrera.';
  }
  if (facts.coveredSubjects === 0) {
    return 'Ninguna materia junta todavía las 10 reseñas del piso. Leer no depende de que reseñes, pero acá todavía no hay nada que leer.';
  }
  if (remaining === 0) {
    return 'Todas sus materias ya juntan las 10 reseñas del piso.';
  }
  return `Las ${remaining} restantes todavía no juntan las 10 reseñas del piso en ninguna de sus cátedras.`;
}
