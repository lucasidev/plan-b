import {
  formatOfficialFactValue,
  OFFICIAL_FACT_FIELDS,
  type OfficialFact,
} from '@/components/facts';

/**
 * La línea de sustento bajo el h1 de la ficha de carrera (US-127, ADR-0090): hasta tres oraciones,
 * cada una solo si su dato oficial está. La duración real habla del hecho de que nadie la publica
 * (no del estado genérico "no publicado"): por eso se ata puntualmente a `NotPublished`, no a
 * cualquier estado sin valor.
 */
export function careerSustentoSentence(byField: ReadonlyMap<string, OfficialFact>): string | null {
  const sentences: string[] = [];

  const paperDuration = byField.get(OFFICIAL_FACT_FIELDS.paperDuration);
  if (paperDuration?.value) {
    sentences.push(
      `Dura ${formatOfficialFactValue(paperDuration.value, paperDuration.unit)} en el papel.`,
    );
  }

  const realDuration = byField.get(OFFICIAL_FACT_FIELDS.realDuration);
  if (realDuration?.status === 'NotPublished') {
    sentences.push('En la realidad, ninguna fuente lo publica.');
  }

  const cohortGraduation = byField.get(OFFICIAL_FACT_FIELDS.cohortGraduation);
  const n = cohortGraduation ? cohortGraduationCount(cohortGraduation) : null;
  if (cohortGraduation && n !== null) {
    const derivedSuffix =
      cohortGraduation.status === 'Derived' ? ' (derivado de la institución entera)' : '';
    sentences.push(`De cada 100 que entran, egresan ${n}${derivedSuffix}.`);
  }

  return sentences.length > 0 ? sentences.join(' ') : null;
}

/** El egreso por cohorte como cuenta de cada 100 (`21,4 %` → 21): redondeado, para la oración de sustento. */
export function cohortGraduationCount(fact: OfficialFact): number | null {
  if (!fact.value) return null;
  const parsed = Number(fact.value.replace(',', '.').replace('%', '').trim());
  return Number.isNaN(parsed) ? null : Math.round(parsed);
}

const YEAR_ORDINALS = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto'];

/** "Primer año", "Segundo año"... hasta sexto; después, el número ("7º año") en vez de inventar un ordinal. */
export function yearLabel(yearInPlan: number): string {
  const ordinal = YEAR_ORDINALS[yearInPlan - 1];
  return ordinal ? `${ordinal} año` : `${yearInPlan}º año`;
}

/** "{n} reseñas · {m} cátedras" (V.career().aside de la maqueta): separador literal, distinto del "en" de `describeSubjectCoverage` (browse-catalog), que sirve a otra pantalla. */
export function describeSubjectReviewsDot(coverage: {
  reviewCount: number;
  chairCount: number;
}): string {
  const reviews = `${coverage.reviewCount} ${coverage.reviewCount === 1 ? 'reseña' : 'reseñas'}`;
  const chairs = `${coverage.chairCount} ${coverage.chairCount === 1 ? 'cátedra' : 'cátedras'}`;
  return `${reviews} · ${chairs}`;
}
