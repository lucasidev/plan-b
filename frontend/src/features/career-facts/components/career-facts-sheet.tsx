import {
  CAREER_OFFICIAL_FACT_ORDER,
  formatOfficialFactValue,
  OFFICIAL_FACT_FIELDS,
  OFFICIAL_FACT_LABELS,
  type OfficialFact,
  officialFactCaption,
  officialFactCellContent,
} from '@/components/facts';
import { FallbackLink } from '@/components/layout/fallback-link';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import {
  type CareerCoverage,
  numberInWords,
  type Subject,
  type SubjectCoverage,
} from '@/features/browse-catalog';
import type { CareerComparison, CareerComparisonOffering } from '@/features/career-comparison';
import { formatShortDate } from '@/lib/format-date';
import { subjectLabel } from '@/lib/subject-label';
import {
  careerSustentoSentence,
  describeSubjectReviewsDot,
  paperDurationStat,
  yearLabel,
} from '../lib/describe-career-header';
import { groupSubjectsByYearOnly } from '../lib/group-subjects-by-year';
import type { CareerFacts } from '../types';

/**
 * La ficha de una carrera (SC-001, US-127, US-133, US-134, ADR-0090), markup literal de la maqueta
 * aprobada (planb-catalogo-adentro.html, `V.career`, `frameApp`).
 *
 * Identidad, cobertura y la facultad (`academicUnitName`) salen de la ficha de reviews
 * (`CareerFacts`); los seis datos oficiales (ADR-0090) salen de un endpoint aparte de academic y
 * viajan como prop separada: son afirmaciones con su propia fuente, no un cálculo sobre reseñas.
 * El plan vigente (`activePlan`) trae sus materias y su cobertura de reviews, ya resueltas por la
 * página, en un solo bloque compacto por año (sin agrupar por cuatrimestre, a diferencia de
 * `/plans/[id]/subjects`). `universityShort` y `comparison` son pedidos nuevos de esta pantalla:
 * cuando fallan, degradan (sin ese segmento del eyebrow, sin la sección "Dónde estudiarla"), la
 * página no se cae.
 *
 * Lo que no muestra nunca: ningún puntaje ni escala, ningún dato oficial sin decir que falta.
 */
type ActivePlan = {
  year: number;
  subjects: Subject[];
  subjectCoverage: SubjectCoverage[];
};

type Props = {
  facts: CareerFacts;
  officialFacts: OfficialFact[];
  /** Todas las carreras del catálogo, para "instituciones que la dictan" (agrupa por `canonicalGroupName`). */
  catalogCoverage: CareerCoverage[];
  /** La facultad que dicta esta carrera (`CareerFacts.academicUnitName`). Null cuando el catálogo todavía no la vinculó. */
  academicUnitName: string | null;
  /** El plan vigente con sus materias y su cobertura de reviews. Null cuando la carrera no tiene un plan Active. */
  activePlan: ActivePlan | null;
  /** El nombre corto de la universidad (`universityShortName`), para el eyebrow. Null si el pedido que la resuelve falla. */
  universityShort: string | null;
  /** Dónde estudiarla (career-comparison). Null si la carrera no existe ahí o si el pedido falla. */
  comparison: CareerComparison | null;
};

export function CareerFactsSheet({
  facts,
  officialFacts,
  catalogCoverage,
  academicUnitName,
  activePlan,
  universityShort,
  comparison,
}: Props) {
  const byField = new Map(officialFacts.map((fact) => [fact.field, fact]));
  const otherOfferings = comparison
    ? comparison.offerings.filter((offering) => offering.careerId !== facts.careerId)
    : [];
  const hasAside = activePlan !== null || otherOfferings.length > 0;

  return (
    <PageFrame
      head={
        <Head
          facts={facts}
          academicUnitName={academicUnitName}
          planYear={activePlan?.year ?? null}
          universityShort={universityShort}
          byField={byField}
        />
      }
      stats={careerStats(facts, byField, catalogCoverage)}
      main={
        <Main
          facts={facts}
          officialFacts={officialFacts}
          byField={byField}
          activePlan={activePlan}
        />
      }
      aside={
        hasAside ? (
          <>
            {activePlan && <StartHere activePlan={activePlan} />}
            {otherOfferings.length > 0 && (
              <WhereToStudy
                careerId={facts.careerId}
                totalOfferings={comparison?.offerings.length ?? 0}
                offerings={otherOfferings}
              />
            )}
          </>
        ) : undefined
      }
    />
  );
}

/**
 * Eyebrow (carrera, universidad corta, facultad y plan vigente, en el estilo mono de un
 * breadcrumb), título, y la línea de sustento armada con los datos oficiales.
 */
function Head({
  facts,
  academicUnitName,
  planYear,
  universityShort,
  byField,
}: {
  facts: CareerFacts;
  academicUnitName: string | null;
  planYear: number | null;
  universityShort: string | null;
  byField: Map<string, OfficialFact>;
}) {
  const eyebrow = [
    'Carrera',
    universityShort,
    academicUnitName,
    planYear ? `plan ${planYear}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  const sustento = careerSustentoSentence(byField);

  return (
    <>
      <div className="pb-eyebrow">{eyebrow}</div>
      <h1 className="pb-serif">{facts.careerName}</h1>
      {sustento && <p className="pb-h-sub">{sustento}</p>}
    </>
  );
}

/** La tira `.pb-stats` (`V.career().stats` de la maqueta). */
function careerStats(
  facts: CareerFacts,
  byField: Map<string, OfficialFact>,
  catalogCoverage: CareerCoverage[],
): PageFrameStat[] {
  const stats: PageFrameStat[] = [];

  stats.push(paperDurationStat(byField.get(OFFICIAL_FACT_FIELDS.paperDuration)));

  const cohortGraduation = byField.get(OFFICIAL_FACT_FIELDS.cohortGraduation);
  const cohortCell = officialFactCellContent(cohortGraduation);
  stats.push([cohortCell.value, `egreso por cohorte${cohortCell.isDerived ? ' · derivado' : ''}`]);

  if (facts.totalSubjects > 0) {
    stats.push([`${facts.coveredSubjects} de ${facts.totalSubjects}`, 'materias medidas']);
  }

  const othersCount = otherInstitutionsCount(catalogCoverage, facts.careerId);
  if (othersCount !== null && othersCount > 0) {
    stats.push([`${othersCount}`, 'instituciones más la dictan']);
  }

  return stats;
}

/**
 * Cuántas otras instituciones dictan esta misma carrera canónica (US-195): el grupo entero menos
 * esta. Sin grupo, `null`: el agrupamiento es una lista curada incompleta, no "esta oferta es la
 * única".
 */
function otherInstitutionsCount(
  catalogCoverage: CareerCoverage[],
  careerId: string,
): number | null {
  const thisOffering = catalogCoverage.find((career) => career.careerId === careerId);
  if (!thisOffering?.canonicalGroupName) return null;

  const universityIds = new Set(
    catalogCoverage
      .filter((career) => career.canonicalGroupName === thisOffering.canonicalGroupName)
      .map((career) => career.universityId),
  );

  return universityIds.size - 1;
}

function Main({
  facts,
  officialFacts,
  byField,
  activePlan,
}: {
  facts: CareerFacts;
  officialFacts: OfficialFact[];
  byField: Map<string, OfficialFact>;
  activePlan: ActivePlan | null;
}) {
  return (
    <div className="min-w-0">
      <OfficialData officialFacts={officialFacts} byField={byField} />
      <Coverage facts={facts} />
      {activePlan ? (
        <PlanSection activePlan={activePlan} />
      ) : (
        <PlanFallback careerId={facts.careerId} />
      )}
      <EditorialNotes facts={facts} />
    </div>
  );
}

/**
 * Los seis datos oficiales de la oferta (ADR-0090, F02, F05), en el orden fijo de
 * `CAREER_OFFICIAL_FACT_ORDER` (compartido con Dónde estudiarla). Acreditación y validez nacional
 * comparten fila (F05, O03): una oferta releva una sola de las dos.
 *
 * Sin relevamiento todavía, el bloque entero lo dice; con relevamiento parcial, cada campo sin
 * afirmación dice que todavía no se relevó, ninguna fila se descarta en silencio (ADR-0090).
 */
function OfficialData({
  officialFacts,
  byField,
}: {
  officialFacts: OfficialFact[];
  byField: Map<string, OfficialFact>;
}) {
  const level =
    byField.get(OFFICIAL_FACT_FIELDS.accreditation) ??
    byField.get(OFFICIAL_FACT_FIELDS.nationalValidity);
  const rows = CAREER_OFFICIAL_FACT_ORDER.filter(
    (field) => field !== OFFICIAL_FACT_FIELDS.nationalValidity,
  ).map((field) =>
    field === OFFICIAL_FACT_FIELDS.accreditation
      ? { field: 'level', fact: level }
      : { field, fact: byField.get(field) },
  );

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Datos oficiales · con su fuente al lado</div>
      <div className="pb-card">
        {officialFacts.length === 0 ? (
          <p className="pb-muted" style={{ fontSize: 13, padding: '10px 0' }}>
            Todavía no tenemos datos oficiales de esta carrera.
          </p>
        ) : (
          <div className="pb-kv">
            {rows.map(({ field, fact }) => (
              <OfficialDataRow
                key={field}
                // Con el dato presente, su propia etiqueta (Acreditación o Validez nacional, la
                // que releva esta oferta); sin ninguna de las dos, la genérica para el placeholder
                // "level": no se sabe cuál falta, así que no se inventa una.
                label={
                  fact
                    ? (OFFICIAL_FACT_LABELS[fact.field] ?? fact.field)
                    : field === 'level'
                      ? 'Acreditación o validez nacional'
                      : OFFICIAL_FACT_LABELS[field]
                }
                fact={fact}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OfficialDataRow({ label, fact }: { label: string; fact: OfficialFact | undefined }) {
  if (!fact) {
    return (
      <div>
        <div className="pb-k">{label}</div>
        <div className="pb-v pb-small">Todavía no se relevó para esta oferta.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-k">{label}</div>
      <div className={fact.status === 'Published' ? 'pb-v' : 'pb-v pb-small'}>
        <OfficialDataValue fact={fact} />
      </div>
      <div className="pb-src pb-meta">{officialFactCaption(fact)}</div>
    </div>
  );
}

function OfficialDataValue({ fact }: { fact: OfficialFact }) {
  switch (fact.status) {
    case 'Published':
      return <>{formatOfficialFactValue(fact.value ?? '', fact.unit)}</>;
    case 'Derived': {
      const methodHref = fact.derivationRuleId ? `/method#${fact.derivationRuleId}` : '/method';
      return (
        <>
          {formatOfficialFactValue(fact.value ?? '', fact.unit)}{' '}
          <FallbackLink href={methodHref} prefetch={false} className="pb-pill">
            derivado
          </FallbackLink>
        </>
      );
    }
    case 'NotApplicable':
      return <span className="pb-pill">No aplica a esta carrera</span>;
    case 'NotPublished':
      return <span className="pb-pill">No publicado por falta de datos</span>;
    default:
      return <span className="pb-pill">{officialFactCellContent(fact).value}</span>;
  }
}

/** Cuánto de esta carrera está medido (US-134): siempre a la vista, nunca oculta detrás de un umbral. */
function Coverage({ facts }: { facts: CareerFacts }) {
  return (
    <section className="pb-section">
      <div className="pb-eyebrow">Cuánto de esta carrera está medido</div>
      <div className="pb-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="pb-serif" style={{ fontSize: 20 }}>
            {facts.coveredSubjects} de {facts.totalSubjects}{' '}
            {facts.totalSubjects === 1 ? 'materia' : 'materias'}
          </span>
          <span className="pb-meta">{facts.coveragePercent} %</span>
        </div>
        <div className="pb-fill" style={{ margin: '8px 0 6px' }}>
          <span style={{ flex: facts.coveredSubjects, background: 'var(--color-ink)' }} />
          <span
            style={{
              flex: facts.totalSubjects - facts.coveredSubjects,
              background: 'var(--color-bg-elev)',
            }}
          />
        </div>
        <p className="pb-muted" style={{ fontSize: 12.5 }}>
          {coverageNote(facts)}
        </p>
      </div>
    </section>
  );
}

function coverageNote(facts: CareerFacts): string {
  if (facts.totalSubjects === 0) {
    return 'Todavía no tenemos materias cargadas para esta carrera.';
  }

  const remaining = facts.totalSubjects - facts.coveredSubjects;

  if (remaining === 0) {
    return 'Todas sus materias ya juntan reseñas suficientes.';
  }
  if (facts.coveredSubjects === 0) {
    return 'Ninguna materia junta todavía reseñas suficientes.';
  }
  return `Las ${remaining} restantes todavía no juntan reseñas suficientes.`;
}

/** El plan vigente, compacto: una columna por año, las materias medidas en negrita (US-134, SC-018). */
function PlanSection({ activePlan }: { activePlan: ActivePlan }) {
  const coverageBySubjectId = new Map(
    activePlan.subjectCoverage.map((coverage) => [coverage.subjectId, coverage]),
  );
  const years = groupSubjectsByYearOnly(activePlan.subjects);

  return (
    <section className="pb-section">
      <div className="pb-eyebrow">
        El plan {activePlan.year} · {activePlan.subjects.length} materias · las medidas en negrita
      </div>
      <div className="pb-card pb-plan">
        {years.map((year) => (
          <div key={year.yearInPlan}>
            <h3>{yearLabel(year.yearInPlan)}</h3>
            <ul>
              {year.subjects.map((subject) => {
                const coverage = coverageBySubjectId.get(subject.id);
                const isCovered = coverage?.isCovered ?? false;
                return (
                  <li key={subject.id} className={isCovered ? 'pb-measured' : ''}>
                    <FallbackLink
                      href={`/subjects/${subject.id}`}
                      // Sin prefetch: ver el porqué en subject-grid.tsx.
                      prefetch={false}
                    >
                      {subject.code && <span className="pb-code">{subject.code}</span>}
                      <span style={{ flex: 1 }}>{subject.name}</span>
                      {!isCovered && coverage && coverage.reviewCount > 0 && (
                        <span className="pb-meta" style={{ fontSize: 10 }}>
                          {coverage.reviewCount} {coverage.reviewCount === 1 ? 'reseña' : 'reseñas'}
                        </span>
                      )}
                      <span className="pb-dot" aria-hidden="true" />
                    </FallbackLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Sin plan vigente (ninguno con `status: 'Active'`), no hay materias que mostrar inline: el único
 * camino a las de un plan histórico es la lista completa de planes.
 */
function PlanFallback({ careerId }: { careerId: string }) {
  return (
    <p className="pb-section" style={{ fontSize: 13 }}>
      <FallbackLink
        href={`/careers/${careerId}/plans`}
        // Sin prefetch: ver el porqué en subject-grid.tsx.
        prefetch={false}
        className="pb-link"
      >
        Ver los planes
      </FallbackLink>
    </p>
  );
}

/**
 * Las notas del equipo (ADR-0084), leídas de comentarios que no se publican. Cada una con su
 * fecha en el eyebrow y el texto entre comillas tipográficas (`V.career().main`, línea 521 de la
 * maqueta aprobada). No se dibuja si no hay ninguna.
 */
function EditorialNotes({ facts }: { facts: CareerFacts }) {
  if (facts.editorialNotes.length === 0) return null;

  return (
    <>
      {facts.editorialNotes.map((note) => (
        <section key={note.id} className="pb-section">
          <div className="pb-eyebrow">
            Nota del equipo · leída de comentarios que no se publican ·{' '}
            {formatShortDate(note.publishedAt)}
          </div>
          <p className="pb-note">“{note.text}”</p>
        </section>
      ))}
    </>
  );
}

/**
 * "Por dónde empezar" (columna derecha): las materias con reseñas, isCovered primero, ordenadas
 * por reseñas. Una materia sin ninguna reseña no entra: no hay nada que leer ahí todavía.
 */
function StartHere({ activePlan }: { activePlan: ActivePlan }) {
  const coverageBySubjectId = new Map(
    activePlan.subjectCoverage.map((coverage) => [coverage.subjectId, coverage]),
  );

  const withReviews = activePlan.subjects
    .map((subject) => ({ subject, coverage: coverageBySubjectId.get(subject.id) }))
    .filter(
      (entry): entry is { subject: Subject; coverage: SubjectCoverage } =>
        (entry.coverage?.reviewCount ?? 0) > 0,
    )
    .sort((a, b) => {
      if (a.coverage.isCovered !== b.coverage.isCovered) {
        return a.coverage.isCovered ? -1 : 1;
      }
      return b.coverage.reviewCount - a.coverage.reviewCount;
    });

  if (withReviews.length === 0) return null;

  return (
    <div className="pb-section min-w-0">
      <div className="pb-eyebrow">Por dónde empezar · las materias con reseñas</div>
      <div className="pb-list" style={{ gap: 4 }}>
        {withReviews.map(({ subject, coverage }) => (
          <FallbackLink
            key={subject.id}
            href={`/subjects/${subject.id}`}
            // Sin prefetch: ver el porqué en subject-grid.tsx.
            prefetch={false}
            style={{ padding: '8px 12px' }}
            className={coverage.isCovered ? 'pb-row' : 'pb-row pb-dim'}
          >
            <span>
              <span className="pb-name" style={{ fontSize: 13.5 }}>
                {subjectLabel(subject.code, subject.name)}
              </span>
              <span className="pb-sub">{describeSubjectReviewsDot(coverage)}</span>
            </span>
            <span className="pb-right pb-muted" aria-hidden="true">
              →
            </span>
          </FallbackLink>
        ))}
      </div>
    </div>
  );
}

/**
 * "Dónde estudiarla" (columna derecha, SC-008, US-128): la misma carrera canónica en otras
 * instituciones de la aglomeración, sin ganador. `offerings` ya viene sin la oferta actual (la
 * página filtra antes de llegar acá).
 */
function WhereToStudy({
  careerId,
  totalOfferings,
  offerings,
}: {
  careerId: string;
  totalOfferings: number;
  offerings: CareerComparisonOffering[];
}) {
  return (
    <div className="pb-section min-w-0">
      <div className="pb-eyebrow">Dónde estudiarla</div>
      <p className="pb-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
        La misma carrera en otras instituciones de la aglomeración, medidas igual. Sin ganador.
      </p>
      <div className="pb-list">
        {offerings.map((offering) => (
          <FallbackLink
            key={offering.careerId}
            href={`/careers/${offering.careerId}`}
            // Sin prefetch: ver el porqué en subject-grid.tsx.
            prefetch={false}
            className="pb-row"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
          >
            <span className="pb-name" style={{ fontSize: 13.5 }}>
              {offering.universityName}
            </span>
            <span className="pb-sub">
              {[
                offering.academicUnitName,
                offering.localityName,
                offering.institutionKind?.toLowerCase(),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <span className="pb-meta" style={{ marginTop: 4 }}>
              Dura en el papel: {paperDurationValue(offering.facts)}
            </span>
          </FallbackLink>
        ))}
      </div>
      <p className="pb-meta" style={{ marginTop: 8 }}>
        <FallbackLink
          href={`/careers/${careerId}/where-to-study`}
          prefetch={false}
          className="pb-link"
        >
          Comparar las {numberInWords(totalOfferings)} lado a lado
        </FallbackLink>
      </p>
    </div>
  );
}

function paperDurationValue(facts: OfficialFact[]): string {
  const fact = facts.find((f) => f.field === OFFICIAL_FACT_FIELDS.paperDuration);
  return officialFactCellContent(fact).value;
}
