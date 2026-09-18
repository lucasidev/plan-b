// Imports directos a los archivos puros de components/facts, no al barrel `@/components/facts`:
// ese barrel también re-exporta `fetchOfficialFactsServer` (server-only), y este archivo lo
// re-exporta a su vez el barrel de browse-catalog que consume `careers/error.tsx` (Client
// Component): entrar por ahí filtraba "server-only" al bundle de cliente.
import { formatOfficialFactValue } from '@/components/facts/format-official-fact-value';
import { OFFICIAL_FACT_FIELDS } from '@/components/facts/official-fact-fields';
import type { SubjectOfficialFacts } from '@/components/facts/official-facts.server';
import type { OfficialFact } from '@/components/facts/types';
import type { CareerCoverage, University } from '../types';
import { numberInWords, universityShortName } from './describe-career-coverage';
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
  /**
   * La tira compacta de Explorar (ADR-0096, maqueta aprobada): una línea por highlight, siempre
   * derivada de `facts`, nunca una segunda fuente de verdad.
   */
  summary: DataHighlightSummary;
};

export type DataHighlightSummary = {
  /** El nombre corto (institución o carrera) del hecho principal, o varios empatados unidos ("Abogacía, Medicina y Contador Público"). */
  name: string;
  href: string | null;
  /** La aclaración corta y atenuada al lado del nombre ("78.964 estudiantes en 2023"). Cadena vacía sin dato que aclarar. */
  annotation: string;
  /** Fuente + lo secundario, ya unidos con " · ", para la línea compacta debajo del nombre. Cadena vacía sin nada que citar. */
  source: string;
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
/** Nombre corto de `CAREER_GUIDE_SOURCE` para la tira compacta (ADR-0096, maqueta aprobada). */
const CAREER_GUIDE_SOURCE_SHORT = 'Guía de carreras SIU';
/** El único `sourceName` que la tira compacta acorta (ADR-0096): "SPU, Anuario..." a "SPU, anuario {período}". */
const SPU_ANUARIO_SOURCE = 'SPU, Anuario de Estadísticas Universitarias';

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
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/%/g, '').trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

/** El período de un hecho, o su nota cuando no hay período: la salvedad de un dato nunca se pierde en silencio. */
function periodOrNote(fact: OfficialFact): string | null {
  return fact.period ?? fact.note ?? null;
}

/** Lista en español para la tira compacta: "A", "A y B", "A, B y C" (nunca coma antes del último). */
function joinSpanish(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** Une fuente + lo secundario en una sola línea chica (ADR-0096), sin tramos vacíos. */
function joinSource(parts: readonly (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(' · ');
}

/** El nombre corto de una fuente citada en la tira compacta (ADR-0096, maqueta aprobada): "SPU, Anuario de Estadísticas Universitarias" a "SPU, anuario {período}"; cualquier otra fuente, tal cual. */
function shortSourceCitation(
  sourceName: string | null | undefined,
  period: string | null | undefined,
): string | null {
  if (!sourceName) return null;
  if (sourceName === SPU_ANUARIO_SOURCE) {
    return period ? `SPU, anuario ${period}` : 'SPU, anuario';
  }
  return sourceName;
}

/**
 * Un hecho institucional cuyo período o nota dice "toda la UTN" (UTN-FRT: el anuario no abre por
 * regional) no es de esa facultad regional sola: en la tira compacta se atribuye a "UTN", nunca a
 * "UTN-FRT" (ADR-0096, maqueta aprobada).
 */
function isUtnAggregate(fact: OfficialFact): boolean {
  const haystack = `${fact.period ?? ''} ${fact.note ?? ''}`.toLowerCase();
  return haystack.includes('toda la utn');
}

/** El nombre corto de una institución para la tira compacta, con la salvedad de `isUtnAggregate`. */
function shortNameFor(university: University, fact: OfficialFact): string {
  return isUtnAggregate(fact) ? 'UTN' : universityShortName(university);
}

/** El primer número de 4 o más dígitos en un texto, o null si no hay ninguno (ADR-0096, maqueta aprobada). */
function firstBigNumber(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/\d{4,}/);
  return match ? Number(match[0]) : null;
}

/** Un entero con separador de miles es-AR ("108986" a "108.986"). */
function formatThousands(n: number): string {
  return n.toLocaleString('es-AR');
}

/**
 * La línea de un hecho `NotPublished` sin dato propio, para la tira compacta (ADR-0096, maqueta
 * aprobada): si la nota trae un número grande, lo cita formateado ("UTN suma 108.986 pero es el
 * total nacional de sus regionales"); si no, dice que no informa ("USPT no informa").
 */
function nonReportingSummaryLine(university: University, fact: OfficialFact): string {
  const name = shortNameFor(university, fact);
  const bigNumber = firstBigNumber(fact.note);
  if (bigNumber !== null) {
    return `${name} suma ${formatThousands(bigNumber)} pero es el total nacional de sus regionales`;
  }
  return `${name} no informa`;
}

/** La primera letra en minúscula, para citar el valor de un hecho a mitad de pregunta (ADR-0096, maqueta aprobada). */
function lowerFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
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
      summary: {
        name: 'Ninguna institución publica cuántos estudiantes tiene.',
        href: null,
        annotation: '',
        source: joinSource(
          notPublished.map(({ university, fact }) => nonReportingSummaryLine(university, fact)),
        ),
      },
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

  const primaryWinner = winners[0];
  return {
    id: 'most-chosen-university',
    label: 'La universidad más elegida',
    facts: [...winnerLines, ...nonReportingLines],
    summary: {
      name: joinSpanish(winners.map((winner) => universityShortName(winner.university))),
      href: winners.length === 1 ? universityHref(primaryWinner.university) : null,
      annotation: `${formatOfficialFactValue(primaryWinner.fact.value ?? '', primaryWinner.fact.unit)} estudiantes${primaryWinner.fact.period ? ` en ${primaryWinner.fact.period}` : ''}`,
      source: joinSource([
        shortSourceCitation(primaryWinner.fact.sourceName, primaryWinner.fact.period),
        ...notPublished.map(({ university, fact }) => nonReportingSummaryLine(university, fact)),
      ]),
    },
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
      summary: {
        name: 'Todavía ninguna carrera se dicta en más de una institución.',
        href: null,
        annotation: '',
        source: CAREER_GUIDE_SOURCE_SHORT,
      },
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
    summary: {
      name: joinSpanish(winners.map((winner) => winner.group.canonicalGroupName)),
      href: null,
      annotation: `en ${numberInWords(max)} ${max === 1 ? 'institución' : 'instituciones'}${winners.length > 1 ? ' cada una' : ''}`,
      source: joinSource([CAREER_GUIDE_SOURCE_SHORT, `${careers.length} ofertas en Tucumán`]),
    },
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
  universityById: Map<string, University>,
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
      summary: {
        name: 'Ninguna fuente publica el egreso por cohorte de ninguna carrera.',
        href: null,
        annotation: '',
        source: '',
      },
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

  /** El nombre corto de la institución de una oferta (ADR-0096): por su id en el catálogo cuando lo tenemos, si no el nombre tal cual llega. */
  const shortUniversityName = (career: CareerCoverage): string => {
    const university = universityById.get(career.universityId);
    return university ? universityShortName(university) : career.universityName;
  };

  /**
   * "16 de cada 100 en UTN-FRT y 15 en UNT para la misma carrera" (ADR-0096, maqueta aprobada): la
   * primera hermana repite "de cada 100", las siguientes no (ya quedó dicho); todas juntas en
   * español, con el cierre solo si hay al menos una.
   */
  const siblingsClause =
    siblings.length === 0
      ? null
      : `${joinSpanish(
          siblings.map((sibling, index) => {
            const shortName = shortUniversityName(sibling.career);
            return index === 0
              ? `${Math.round(sibling.value)} de cada 100 en ${shortName}`
              : `${Math.round(sibling.value)} en ${shortName}`;
          }),
        )} para la misma carrera`;

  /**
   * Cuando NINGUNA oferta del grupo (no solo las que tienen `cohort_graduation`) publica
   * `real_duration`, la tira compacta lo dice: es la salvedad que compensa comparar por un proxy
   * en vez de la duración real (ADR-0096, maqueta aprobada).
   */
  const groupCareers = best.career.canonicalGroupName
    ? careers.filter((c) => c.canonicalGroupName === best.career.canonicalGroupName)
    : [best.career];
  const noGroupMemberPublishesRealDuration = groupCareers.every((c) => {
    const fact = (offeringFacts.get(c.careerId) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.realDuration,
    );
    return fact?.status === 'NotPublished';
  });

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
    summary: {
      name: `${best.career.careerName}, ${shortUniversityName(best.career)}`,
      href: careerHref(best.career.careerId),
      annotation: `egresan ${Math.round(best.value)} de cada 100`,
      // El link "egreso por cohorte, derivado" (derivedTagFor) va aparte, antes de esta línea: el
      // componente lo arma leyendo `facts[0].derivedTag`, para que sea un link de verdad.
      source: joinSource([
        siblingsClause,
        noGroupMemberPublishesRealDuration ? 'la duración real no la publica ninguna fuente' : null,
      ]),
    },
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
      summary: {
        name: 'Ninguna institución publica su proporción de reinscriptos con dos o más materias aprobadas.',
        href: null,
        annotation: '',
        source: '',
      },
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
    summary: {
      name: shortNameFor(best.university, best.fact),
      href: universityHref(best.university),
      annotation: `${formatOfficialFactValue(best.fact.value ?? '', best.fact.unit)} avanza dos materias o más por año`,
      source: joinSource([
        shortSourceCitation(best.fact.sourceName, best.fact.period),
        rest.length === 0
          ? null
          : rest
              .map(
                (entry) =>
                  `${formatOfficialFactValue(entry.fact.value ?? '', entry.fact.unit)} en ${shortNameFor(entry.university, entry.fact)}`,
              )
              .join(', '),
      ]),
    },
  };
}

/**
 * 5. La universidad con mejor valoración de la entidad auditora: instituciones con
 * `institutional_evaluation` Published. Con una sola, se dice que es la única; con varias, se
 * listan con su año, todas `primary` (sin decir "mejor": no hay puntaje que comparar). Cada una
 * cita su propia fuente (el portal de transparencia de esa institución, no un nombre fijo).
 */
function auditedByConeau(
  universities: readonly University[],
  institutionFacts: Map<string, OfficialFact[]>,
): DataHighlight {
  const label = 'La universidad con mejor valoración de la entidad auditora';
  const withData: { university: University; fact: OfficialFact }[] = [];

  for (const university of universities) {
    const fact = (institutionFacts.get(university.id) ?? []).find(
      (f) => f.field === OFFICIAL_FACT_FIELDS.institutionalEvaluation,
    );
    if (fact && fact.status === 'Published') withData.push({ university, fact });
  }

  /** "las otras cuatro, sin acreditación institucional relevada" (ADR-0096, maqueta aprobada): nada si ya están todas evaluadas. */
  const othersClause = (evaluatedCount: number): string | null => {
    const rest = universities.length - evaluatedCount;
    return rest > 0
      ? `las otras ${numberInWords(rest)}, sin acreditación institucional relevada`
      : null;
  };

  if (withData.length === 0) {
    return {
      id: 'institutional-evaluation',
      label,
      facts: [
        {
          text: 'Ninguna institución tiene evaluación institucional de CONEAU publicada.',
          href: null,
          tier: 'primary',
        },
      ],
      summary: {
        name: 'Ninguna institución tiene evaluación institucional de CONEAU publicada.',
        href: null,
        annotation: '',
        source: '',
      },
    };
  }

  if (withData.length === 1) {
    const { university, fact } = withData[0];
    return {
      id: 'institutional-evaluation',
      label,
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
      summary: {
        name: universityShortName(university),
        href: universityHref(university),
        annotation: 'acreditaciones al día',
        source: joinSource([lowerFirst(fact.value ?? ''), fact.sourceName, othersClause(1)]),
      },
    };
  }

  const sorted = [...withData].sort((a, b) =>
    a.university.name.localeCompare(b.university.name, 'es'),
  );
  return {
    id: 'institutional-evaluation',
    label,
    facts: sorted.map(({ university, fact }) => ({
      text: `${university.name}${fact.period ? ` (${fact.period})` : ''}`,
      href: universityHref(university),
      tier: 'primary',
      sourceName: fact.sourceName,
    })),
    summary: {
      name: joinSpanish(sorted.map(({ university }) => universityShortName(university))),
      href: null,
      annotation: 'acreditaciones al día',
      source: joinSource([
        ...sorted.map(({ fact }) => joinSource([lowerFirst(fact.value ?? ''), fact.sourceName])),
        othersClause(sorted.length),
      ]),
    },
  };
}

/**
 * Las cinco líneas de "Lo que los datos dicen" (ADR-0096, columna derecha de la lente de
 * Universidades): cada una un hecho de un solo dato oficial o de catálogo, nunca un compuesto.
 */
export function computeDataHighlights(input: DataHighlightsInput): DataHighlight[] {
  const institutionFacts = bySubjectId(input.institutionFacts);
  const offeringFacts = bySubjectId(input.offeringFacts);
  const universityById = new Map(
    input.universities.map((university) => [university.id, university]),
  );

  return [
    mostChosenUniversity(input.universities, institutionFacts),
    mostOfferedCareer(input.careers),
    bestGraduationRate(input.careers, offeringFacts, universityById),
    mostAdvancingUniversity(input.universities, institutionFacts),
    auditedByConeau(input.universities, institutionFacts),
  ];
}
