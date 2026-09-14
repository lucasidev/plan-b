// Imports directos a los archivos puros de components/facts, no al barrel `@/components/facts`:
// ese barrel también re-exporta `fetchOfficialFactsServer` (server-only), y este archivo lo
// re-exporta a su vez el barrel de browse-catalog que consume `careers/error.tsx` (Client
// Component): entrar por ahí filtraba "server-only" al bundle de cliente.
import { formatOfficialFactValue } from '@/components/facts/format-official-fact-value';
import { OFFICIAL_FACT_FIELDS } from '@/components/facts/official-fact-fields';
import type { SubjectOfficialFacts } from '@/components/facts/official-facts.server';
import type { OfficialFact } from '@/components/facts/types';
import type { CareerCoverage, University } from '../types';
import { groupCareersByCanonical } from './group-careers-by-canonical';

/**
 * Lo que Explorar interpreta de los datos oficiales, por institución y por carrera (ADR-0096): un
 * hecho de un solo dato, nunca un compuesto. `tier` distingue explícitamente lo primario (el
 * ganador, o todos los empatados en el máximo) de lo secundario (quién no informa, el resto del
 * grupo): nunca se infiere de la posición en el array. `sourceName` y `period` viajan por línea
 * (no por highlight): dos hechos del mismo highlight pueden citar fuentes o períodos distintos
 * (ej. cada institución evaluada por CONEAU lo publica en su propio portal de transparencia).
 */
export type DataHighlight = {
  id: string;
  label: string;
  facts: DataHighlightFact[];
};

export type DataHighlightFact = {
  text: string;
  href: string | null;
  tier: 'primary' | 'secondary';
  sourceName?: string | null;
  /** El período (o, si el hecho no tiene período, su nota) tal como lo relevamos: nunca se pierde la salvedad. */
  period?: string | null;
  /** Cuando el hecho es Derived (ADR-0090): la etiqueta entre paréntesis con su propio link a la regla en Método. */
  derivedTag?: { label: string; href: string } | null;
  /** Instituciones de un mismo grupo, cada una linkeada a su propia oferta (ej. "en UNSTA, UNT y San Pablo-T"). */
  links?: { label: string; href: string }[];
};

export type DataHighlightsInput = {
  universities: readonly University[];
  careers: readonly CareerCoverage[];
  institutionFacts: readonly SubjectOfficialFacts[];
  offeringFacts: readonly SubjectOfficialFacts[];
};

/** No es un dato oficial (ADR-0090): es la fuente fija del catálogo académico, tal como la nombra el relevamiento. */
const CAREER_GUIDE_SOURCE = 'Guía de carreras universitarias (SIU)';

function bySubjectId(list: readonly SubjectOfficialFacts[]): Map<string, OfficialFact[]> {
  return new Map(list.map((subject) => [subject.subjectId, subject.facts]));
}

function universityHref(university: University): string {
  return `/universities/${university.slug}/careers`;
}

function careerHref(careerId: string): string {
  return `/careers/${careerId}`;
}

/**
 * Un valor numérico oficial en formato es-AR ("53,7 %", "108.986", "1.234,5") a número JS, o null
 * si no parsea (un `Published` sin dato de verdad, o texto como "no informado"). El punto es
 * siempre separador de miles y la coma siempre decimal: hay que sacar los puntos ANTES de
 * convertir la coma, o "108.986" se lee como 108,986.
 */
export function parseNumericValue(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

/** El período de un hecho, o su nota cuando no hay período: la salvedad de un dato nunca se pierde en silencio. */
function periodOrNote(fact: OfficialFact): string | null {
  return fact.period ?? fact.note ?? null;
}

/** La etiqueta "derivado" con su link a la regla en Método (ADR-0090), solo cuando el hecho es Derived. */
function derivedTagFor(fact: OfficialFact): DataHighlightFact['derivedTag'] {
  if (fact.status !== 'Derived') return null;
  return {
    label: 'egreso por cohorte, derivado de la institución entera',
    href: fact.derivationRuleId ? `/method#${fact.derivationRuleId}` : '/method',
  };
}

/**
 * 1. La universidad más elegida: mayor `students` Published, con quienes no informan debajo
 * (su nota tal cual, sin reescribirla). Con empate, todas las ganadoras son `tier: 'primary'`.
 */
function mostChosenUniversity(
  universities: readonly University[],
  institutionFacts: Map<string, OfficialFact[]>,
): DataHighlight {
  const published: { university: University; fact: OfficialFact; value: number }[] = [];
  const notPublished: { university: University; fact: OfficialFact }[] = [];

  for (const university of universities) {
    const fact = (institutionFacts.get(university.id) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.students,
    );
    if (!fact) continue;
    if (fact.status === 'Published') {
      const value = parseNumericValue(fact.value);
      if (value !== null) published.push({ university, fact, value });
    } else if (fact.status === 'NotPublished' && fact.note) {
      notPublished.push({ university, fact });
    }
  }

  const nonReportingLines: DataHighlightFact[] = notPublished.map(({ university, fact }) => ({
    text: `${university.name}: ${fact.note}`,
    href: null,
    tier: 'secondary',
    sourceName: fact.sourceName,
    period: periodOrNote(fact),
  }));

  if (published.length === 0) {
    return {
      id: 'most-chosen-university',
      label: 'La universidad más elegida',
      facts: [
        {
          text: 'Ninguna institución publica cuántos estudiantes tiene.',
          href: null,
          tier: 'primary',
        },
        ...nonReportingLines,
      ],
    };
  }

  const max = Math.max(...published.map((p) => p.value));
  const winners = published
    .filter((p) => p.value === max)
    .sort((a, b) => a.university.name.localeCompare(b.university.name, 'es'));

  const winnerLines: DataHighlightFact[] = winners.map(({ university, fact }) => ({
    text: `${university.name}: ${formatOfficialFactValue(fact.value ?? '', fact.unit)} estudiantes`,
    href: universityHref(university),
    tier: 'primary',
    sourceName: fact.sourceName,
    period: periodOrNote(fact),
  }));

  return {
    id: 'most-chosen-university',
    label: 'La universidad más elegida',
    facts: [...winnerLines, ...nonReportingLines],
  };
}

/**
 * 2. La carrera más ofrecida: el grupo de carrera canónica dictado en más instituciones distintas.
 * Cada grupo ganador muestra TODAS sus instituciones como links a su propia oferta (nunca un link
 * arbitrario a "la primera"), alfabético. Con empate, todos los grupos ganadores son `primary`.
 */
function mostOfferedCareer(careers: readonly CareerCoverage[]): DataHighlight {
  const { multiInstitution } = groupCareersByCanonical(careers);

  if (multiInstitution.length === 0) {
    return {
      id: 'most-offered-career',
      label: 'La carrera más ofrecida',
      facts: [
        {
          text: 'Todavía ninguna carrera se dicta en más de una institución.',
          href: null,
          tier: 'primary',
          sourceName: CAREER_GUIDE_SOURCE,
        },
      ],
    };
  }

  const withCount = multiInstitution.map((group) => ({
    group,
    count: new Set(group.offerings.map((o) => o.universityId)).size,
  }));
  const max = Math.max(...withCount.map((w) => w.count));
  const winners = withCount
    .filter((w) => w.count === max)
    .sort((a, b) => a.group.canonicalGroupName.localeCompare(b.group.canonicalGroupName, 'es'));

  return {
    id: 'most-offered-career',
    label: 'La carrera más ofrecida',
    facts: winners.map(({ group }) => ({
      text: `${group.canonicalGroupName}: en`,
      href: null,
      tier: 'primary',
      sourceName: CAREER_GUIDE_SOURCE,
      links: [...group.offerings]
        .sort((a, b) => a.universityName.localeCompare(b.universityName, 'es'))
        .map((offering) => ({
          label: offering.universityName,
          href: careerHref(offering.careerId),
        })),
    })),
  };
}

/**
 * 3. La carrera con mejor tiempo de salida: mayor `cohort_graduation` (Published o Derived), entre
 * TODAS las ofertas del catálogo con el dato. Los tres hechos vigentes son Derived (proxy de flujo
 * institucional, `graduation-flow-proxy`): la línea lo dice y linkea a la regla, como cualquier
 * derivado (ADR-0090). Las demás ofertas de su mismo grupo canónico, si las hay, debajo, con su
 * propio número y su propio link a la regla si también son derivadas.
 */
function bestGraduationRate(
  careers: readonly CareerCoverage[],
  offeringFacts: Map<string, OfficialFact[]>,
): DataHighlight {
  const withData: { career: CareerCoverage; fact: OfficialFact; value: number }[] = [];

  for (const career of careers) {
    const fact = (offeringFacts.get(career.careerId) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.cohortGraduation,
    );
    if (!fact || (fact.status !== 'Published' && fact.status !== 'Derived')) continue;
    const value = parseNumericValue(fact.value);
    if (value !== null) withData.push({ career, fact, value });
  }

  if (withData.length === 0) {
    return {
      id: 'best-graduation-rate',
      label: 'La carrera con mejor tiempo de salida',
      facts: [
        {
          text: 'Ninguna fuente publica el egreso por cohorte de ninguna carrera.',
          href: null,
          tier: 'primary',
        },
      ],
    };
  }

  const best = withData.reduce((a, b) => (b.value > a.value ? b : a));
  const total = withData.length;
  const totalLabel = `${total} ${total === 1 ? 'oferta' : 'ofertas'}`;

  const siblings = best.career.canonicalGroupName
    ? withData
        .filter(
          (d) =>
            d.career.canonicalGroupName === best.career.canonicalGroupName &&
            d.career.careerId !== best.career.careerId,
        )
        .sort((a, b) => b.value - a.value)
    : [];

  return {
    id: 'best-graduation-rate',
    label: 'La carrera con mejor tiempo de salida',
    facts: [
      {
        text: `${best.career.careerName}, ${best.career.universityName}: egresan ${Math.round(best.value)} de cada 100`,
        href: careerHref(best.career.careerId),
        tier: 'primary',
        sourceName: best.fact.sourceName,
        period: periodOrNote(best.fact),
        derivedTag: derivedTagFor(best.fact),
      },
      {
        text: `Entre las ${totalLabel} con el dato.`,
        href: null,
        tier: 'secondary',
      },
      ...siblings.map((sibling) => ({
        text: `${Math.round(sibling.value)} de cada 100 en ${sibling.career.universityName}`,
        href: careerHref(sibling.career.careerId),
        tier: 'secondary' as const,
        sourceName: sibling.fact.sourceName,
        period: periodOrNote(sibling.fact),
        derivedTag: derivedTagFor(sibling.fact),
      })),
    ],
  };
}

/**
 * El nombre que identifica a una institución en una línea de `advancing_share`: su nombre, salvo
 * que el hecho traiga una nota (el número no es solo de esa institución, como el caso de UTN-FRT
 * que reporta "toda la UTN"), donde se muestra el período tal cual lo relevamos en vez de inventar
 * una redacción propia. Se aplica igual a la línea del máximo y a las secundarias: la salvedad no
 * es solo un detalle de las que no ganan.
 */
function advancingAttribution(university: University, fact: OfficialFact): string {
  if (fact.note && fact.period) return fact.period;
  return university.name;
}

/**
 * 4. La universidad donde más alumnos avanzan: mayor `advancing_share` Published, con las demás
 * instituciones que también lo publican, debajo, con su propio número.
 */
function mostAdvancingUniversity(
  universities: readonly University[],
  institutionFacts: Map<string, OfficialFact[]>,
): DataHighlight {
  const withData: { university: University; fact: OfficialFact; value: number }[] = [];

  for (const university of universities) {
    const fact = (institutionFacts.get(university.id) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.advancingShare,
    );
    if (!fact || fact.status !== 'Published') continue;
    const value = parseNumericValue(fact.value);
    if (value !== null) withData.push({ university, fact, value });
  }

  if (withData.length === 0) {
    return {
      id: 'most-advancing-university',
      label: 'La universidad donde más alumnos avanzan',
      facts: [
        {
          text: 'Ninguna institución publica su proporción de reinscriptos con dos o más materias aprobadas.',
          href: null,
          tier: 'primary',
        },
      ],
    };
  }

  const [best, ...rest] = [...withData].sort((a, b) => b.value - a.value);

  return {
    id: 'most-advancing-university',
    label: 'La universidad donde más alumnos avanzan',
    facts: [
      {
        text: `${advancingAttribution(best.university, best.fact)}: ${formatOfficialFactValue(best.fact.value ?? '', best.fact.unit)} de reinscriptos con dos o más materias aprobadas`,
        href: universityHref(best.university),
        tier: 'primary',
        sourceName: best.fact.sourceName,
        period: periodOrNote(best.fact),
      },
      ...rest.map((entry) => ({
        text: `${formatOfficialFactValue(entry.fact.value ?? '', entry.fact.unit)} en ${advancingAttribution(entry.university, entry.fact)}`,
        href: universityHref(entry.university),
        tier: 'secondary' as const,
        sourceName: entry.fact.sourceName,
        period: periodOrNote(entry.fact),
      })),
    ],
  };
}

/**
 * 5. La evaluación de la entidad auditora: instituciones con `institutional_evaluation` Published.
 * Con una sola, se dice que es la única; con varias, se listan con su año, todas `primary` (sin
 * decir "mejor": no hay puntaje que comparar). Cada una cita su propia fuente (el portal de
 * transparencia de esa institución, no un nombre fijo).
 */
function auditedByConeau(
  universities: readonly University[],
  institutionFacts: Map<string, OfficialFact[]>,
): DataHighlight {
  const withData: { university: University; fact: OfficialFact }[] = [];

  for (const university of universities) {
    const fact = (institutionFacts.get(university.id) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.institutionalEvaluation,
    );
    if (fact && fact.status === 'Published') withData.push({ university, fact });
  }

  if (withData.length === 0) {
    return {
      id: 'institutional-evaluation',
      label: 'La evaluación de la entidad auditora',
      facts: [
        {
          text: 'Ninguna institución tiene evaluación institucional de CONEAU publicada.',
          href: null,
          tier: 'primary',
        },
      ],
    };
  }

  if (withData.length === 1) {
    const { university, fact } = withData[0];
    return {
      id: 'institutional-evaluation',
      label: 'La evaluación de la entidad auditora',
      facts: [
        {
          text: `La única con evaluación institucional de CONEAU publicada: ${university.name}${
            fact.period ? ` (${fact.period})` : ''
          }`,
          href: universityHref(university),
          tier: 'primary',
          sourceName: fact.sourceName,
        },
      ],
    };
  }

  const sorted = [...withData].sort((a, b) =>
    a.university.name.localeCompare(b.university.name, 'es'),
  );
  return {
    id: 'institutional-evaluation',
    label: 'La evaluación de la entidad auditora',
    facts: sorted.map(({ university, fact }) => ({
      text: `${university.name}${fact.period ? ` (${fact.period})` : ''}`,
      href: universityHref(university),
      tier: 'primary',
      sourceName: fact.sourceName,
    })),
  };
}

/**
 * Las cinco líneas de "Lo que los datos dicen" (ADR-0096, columna derecha de la lente de
 * Universidades): cada una un hecho de un solo dato oficial o de catálogo, nunca un compuesto.
 */
export function computeDataHighlights(input: DataHighlightsInput): DataHighlight[] {
  const institutionFacts = bySubjectId(input.institutionFacts);
  const offeringFacts = bySubjectId(input.offeringFacts);

  return [
    mostChosenUniversity(input.universities, institutionFacts),
    mostOfferedCareer(input.careers),
    bestGraduationRate(input.careers, offeringFacts),
    mostAdvancingUniversity(input.universities, institutionFacts),
    auditedByConeau(input.universities, institutionFacts),
  ];
}
