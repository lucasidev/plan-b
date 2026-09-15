import {
  formatOfficialFactValue,
  OFFICIAL_FACT_FIELDS,
  type OfficialFact,
  officialFactCellContent,
} from '@/components/facts';
import type { PageFrameStat } from '@/components/layout/page-frame';

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

/**
 * La celda "en el papel" de la tira (V.career().stats de la maqueta aprobada: valor "2 ½",
 * etiqueta "años en el papel"): el número al principio de `paper_duration`, con medios ("y
 * medio", o una fracción ",5"/".5"). Solo con `unit === 'years'`: un valor en otra unidad (por
 * ejemplo "5 semestres", con `unit: null`) no son años, y la forma compacta lo diría igual. Sin
 * esa unidad, sin número al principio, sin fracción reconocible o sin dato Published, cae al
 * valor genérico de `officialFactCellContent` con la etiqueta de siempre.
 */
export function paperDurationStat(fact: OfficialFact | undefined): PageFrameStat {
  if (fact?.status === 'Published' && fact.value && fact.unit === 'years') {
    const parsed = parseLeadingYears(fact.value);
    if (parsed) {
      const { whole, half } = parsed;
      const value = half ? `${whole} ½` : `${whole}`;
      const label = whole === 1 && !half ? 'año en el papel' : 'años en el papel';
      return [value, label];
    }
  }
  return [officialFactCellContent(fact).value, 'en el papel'];
}

/** El entero inicial de un texto de duración, y si trae medio: por decimal (",5"/".5") o por la palabra "medio". */
function parseLeadingYears(raw: string): { whole: number; half: boolean } | null {
  const match = raw.match(/^(\d+)(?:[.,](\d+))?/);
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = match[2];
  if (fraction) {
    return fraction === '5' ? { whole, half: true } : null;
  }
  return { whole, half: /\bmedio\b/i.test(raw) };
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
