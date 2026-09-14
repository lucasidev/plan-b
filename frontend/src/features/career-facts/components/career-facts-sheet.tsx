import Link from 'next/link';
import {
  CAREER_OFFICIAL_FACT_ORDER,
  MissingFactRow,
  NumberCell,
  OFFICIAL_FACT_FIELDS,
  OFFICIAL_FACT_LABELS,
  type OfficialFact,
  OfficialFactRow,
  officialFactCellContent,
} from '@/components/facts';
import {
  type CareerCoverage,
  describeSubjectCoverage,
  type Subject,
  type SubjectCoverage,
  SubjectGrid,
} from '@/features/browse-catalog';
import { formatShortDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import type { CareerFacts } from '../types';

/**
 * La ficha de una carrera (SC-001, US-127, US-133, US-134, ADR-0085, ADR-0090).
 *
 * Identidad, cobertura y la facultad (`academicUnitName`) salen de la ficha de reviews
 * (`CareerFacts`); los seis datos oficiales (ADR-0090) salen de un endpoint aparte de academic y
 * viajan como prop separada: son afirmaciones con su propia fuente, no un cálculo sobre reseñas.
 * El plan vigente (`activePlan`) trae sus materias y su cobertura de reviews, ya resueltas por la
 * página. "Qué frena la cursada" y la nota de curaduría necesitan un corpus de reseñas que hoy es
 * cero: no se mockean ni se dejan con un placeholder de números falsos.
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
  /**
   * A dónde manda "Reseñá tu cursada" (US-229): sin sesión, directo al gate con el motivo, en
   * vez de a `/reviews/new` (que el guard de `(member)` redirigiría igual, pero sin decir para
   * qué). Lo decide la página (`reviewCtaHref`, que sabe si hay sesión); el default acá es el
   * camino directo, para no forzar a cada test a pasarlo.
   */
  reviewHref?: string;
};

export function CareerFactsSheet({
  facts,
  officialFacts,
  catalogCoverage,
  academicUnitName,
  activePlan,
  reviewHref = '/reviews/new',
}: Props) {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Header
          facts={facts}
          academicUnitName={academicUnitName}
          planYear={activePlan?.year ?? null}
        />
        <Numbers facts={facts} officialFacts={officialFacts} catalogCoverage={catalogCoverage} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <OfficialData officialFacts={officialFacts} />
            <Coverage facts={facts} />
            {activePlan ? (
              <PlanSection activePlan={activePlan} />
            ) : (
              <PlanFallback careerId={facts.careerId} />
            )}
            <EditorialNotes facts={facts} />
            <Footer reviewHref={reviewHref} />
          </div>
          <div className="flex flex-col gap-5">
            {activePlan && <StartHere activePlan={activePlan} />}
            <CompareLink careerId={facts.careerId} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Eyebrow (la jerarquía completa: carrera, universidad, facultad y plan vigente, en el estilo mono
 * de un breadcrumb del catálogo), título, y una línea en prosa para quien no conoce la jerga
 * académica: la misma facultad y universidad del eyebrow, dichas como una oración.
 */
function Header({
  facts,
  academicUnitName,
  planYear,
}: {
  facts: CareerFacts;
  academicUnitName: string | null;
  planYear: number | null;
}) {
  const eyebrow = [
    'Carrera',
    facts.universityName,
    academicUnitName,
    planYear ? `plan ${planYear}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  return (
    <div className="mb-[18px]">
      <p className="mb-1.5 font-mono text-[11px] tracking-[0.02em] text-ink-3">{eyebrow}</p>
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">{facts.careerName}</h1>
      <p className="text-[13px] text-ink-2">
        {academicUnitName
          ? `Se dicta en la ${academicUnitName} de la ${facts.universityName}.`
          : `Se dicta en la ${facts.universityName}.`}
      </p>
    </div>
  );
}

/**
 * La tira de números (mismo patrón de celdas que la ficha de materia): dura en el papel, egreso
 * por cohorte (con su chip "derivado" cuando lo es), cuántas materias están medidas, y cuántas
 * instituciones dictan esta misma carrera canónica. Las dos últimas no se dibujan cuando no hay
 * nada que contar: sin materias cargadas, o sin grupo canónico (el agrupamiento es una lista
 * curada incompleta, US-195: que una oferta no tenga grupo todavía no prueba que sea la única).
 */
function Numbers({
  facts,
  officialFacts,
  catalogCoverage,
}: {
  facts: CareerFacts;
  officialFacts: OfficialFact[];
  catalogCoverage: CareerCoverage[];
}) {
  const byField = new Map(officialFacts.map((fact) => [fact.field, fact]));
  const paperDuration = officialFactCellContent(byField.get(OFFICIAL_FACT_FIELDS.paperDuration));
  const cohortGraduation = officialFactCellContent(
    byField.get(OFFICIAL_FACT_FIELDS.cohortGraduation),
  );
  const institutions = institutionsOffering(catalogCoverage, facts.careerId);

  return (
    <section className="mb-5 grid grid-cols-2 gap-2.5">
      <NumberCell
        label="Dura en el papel"
        value={paperDuration.value}
        note={paperDuration.note}
        isDerived={paperDuration.isDerived}
        derivationRuleId={paperDuration.derivationRuleId}
      />
      <NumberCell
        label="Egreso por cohorte"
        value={cohortGraduation.value}
        note={cohortGraduation.note}
        isDerived={cohortGraduation.isDerived}
        derivationRuleId={cohortGraduation.derivationRuleId}
      />
      {facts.totalSubjects > 0 && (
        <NumberCell
          label="Materias medidas"
          value={`${facts.coveredSubjects} de ${facts.totalSubjects}`}
        />
      )}
      {institutions && <NumberCell label="Instituciones que la dictan" value={institutions} />}
    </section>
  );
}

/**
 * Cuántas instituciones distintas dictan esta misma carrera canónica (US-195): cuenta las
 * `universityId` únicas del grupo al que pertenece esta oferta. Sin grupo, no hay nada que
 * afirmar: el agrupamiento es una lista curada incompleta, no "esta oferta es la única".
 */
function institutionsOffering(catalogCoverage: CareerCoverage[], careerId: string): string | null {
  const thisOffering = catalogCoverage.find((career) => career.careerId === careerId);
  if (!thisOffering?.canonicalGroupName) {
    return null;
  }

  const universityIds = new Set(
    catalogCoverage
      .filter((career) => career.canonicalGroupName === thisOffering.canonicalGroupName)
      .map((career) => career.universityId),
  );

  return `${universityIds.size} ${universityIds.size === 1 ? 'institución' : 'instituciones'}`;
}

/**
 * Los seis datos oficiales de la oferta (ADR-0090, F02, F05), en el orden fijo de
 * `CAREER_OFFICIAL_FACT_ORDER` (compartido con Dónde estudiarla: la misma oferta se lee igual sola
 * o al lado de otras). Acreditación y validez nacional comparten fila (F05, O03: una oferta releva
 * una sola de las dos), mismo criterio que `career-comparison-view.tsx`.
 *
 * Sin relevamiento todavía, el bloque entero lo dice en vez de dejar un espacio en blanco; con
 * relevamiento parcial, cada campo sin afirmación dice que todavía no se relevó, igual que Dónde
 * estudiarla: ninguna fila se descarta en silencio (ADR-0090).
 */
function OfficialData({ officialFacts }: { officialFacts: OfficialFact[] }) {
  const byField = new Map(officialFacts.map((fact) => [fact.field, fact]));
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
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Datos oficiales</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {officialFacts.length === 0 ? (
          <p className="py-3 text-[13px] leading-relaxed text-ink-3">
            Todavía no tenemos datos oficiales de esta carrera.
          </p>
        ) : (
          rows.map(({ field, fact }, index) => {
            const last = index === rows.length - 1;
            return fact ? (
              <OfficialFactRow key={fact.id} fact={fact} subject="career" last={last} />
            ) : (
              <MissingFactRow
                key={field}
                label={
                  field === 'level'
                    ? 'Acreditación o validez nacional'
                    : OFFICIAL_FACT_LABELS[field]
                }
                last={last}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

/**
 * Adónde va la ficha después de leer sus datos oficiales (SC-008, US-128): comparar esta misma
 * oferta con las de otras instituciones de su misma aglomeración. Un link de texto, no un botón:
 * no compite con "Reseñá tu cursada", que es la acción principal de esta pantalla.
 */
function CompareLink({ careerId }: { careerId: string }) {
  return (
    <p className="text-[13px]">
      <Link
        href={`/careers/${careerId}/where-to-study`}
        // Sin prefetch: la ficha es `force-dynamic` y no tiene loading.tsx (ver subject-grid.tsx
        // para el detalle completo).
        prefetch={false}
        className="text-accent-ink underline-offset-2 hover:underline"
      >
        Comparar con otras instituciones
      </Link>
    </p>
  );
}

/**
 * Las notas del equipo (ADR-0084). Van con su procedencia dicha y su fecha, porque una síntesis sin
 * decir de dónde sale es una opinión: lo que la hace legible es saber que se leyó de comentarios
 * que el producto no publica.
 *
 * No se dibuja si no hay ninguna. Un bloque vacío que dice "el equipo todavía no escribió nada"
 * ocupa lugar para no informar nada.
 */
function EditorialNotes({ facts }: { facts: CareerFacts }) {
  if (facts.editorialNotes.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">De la curaduría</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        {facts.editorialNotes.map((note, index) => (
          <div key={note.id} className={index === 0 ? '' : 'mt-3 border-t border-line-2 pt-3'}>
            <p className="text-[13.5px] leading-relaxed text-ink">{note.text}</p>
            <p className="mt-1.5 text-[11px] text-ink-3">
              Nota del equipo, leída de comentarios que no se publican
              <span className="font-mono"> · {formatShortDate(note.publishedAt)}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Cuánto de esta carrera está medido (US-134): siempre a la vista, nunca oculta detrás de un umbral. */
function Coverage({ facts }: { facts: CareerFacts }) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Cuánto de esta carrera está medido</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[14px] text-ink">
            {facts.coveredSubjects} de {facts.totalSubjects}{' '}
            {facts.totalSubjects === 1 ? 'materia' : 'materias'}
          </span>
          <span className="text-[12.5px] text-ink-2" style={{ fontFamily: 'var(--font-mono)' }}>
            {facts.coveragePercent} %
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[3px] bg-bg-elev">
          <div
            className="h-full rounded-[3px] bg-ink"
            style={{ width: `${facts.coveragePercent}%` }}
          />
        </div>
        <p className="mt-2.5 text-[12px] text-ink-3">{coverageNote(facts)}</p>
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

/** El plan vigente, agrupado por año y término, con cuánto junta cada materia (US-134, SC-018). */
function PlanSection({ activePlan }: { activePlan: ActivePlan }) {
  const subjectCoverage = new Map(
    activePlan.subjectCoverage.map((coverage) => [coverage.subjectId, coverage]),
  );

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">El plan {activePlan.year}</p>
      <SubjectGrid subjects={activePlan.subjects} subjectCoverage={subjectCoverage} />
    </section>
  );
}

/**
 * Sin plan vigente (ninguno con `status: 'Active'`), no hay materias que mostrar inline: el único
 * camino a las de un plan histórico es la lista completa de planes.
 */
function PlanFallback({ careerId }: { careerId: string }) {
  return (
    <p className="mb-5 text-[13px]">
      <Link
        href={`/careers/${careerId}/plans`}
        // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
        prefetch={false}
        className="text-accent-ink underline-offset-2 hover:underline"
      >
        Ver los planes
      </Link>
    </p>
  );
}

/**
 * "Por dónde empezar" (columna derecha): las materias del plan que ya publican (cruzaron el piso,
 * `isCovered`), de más a menos reseñas (dato, no conveniencia). Una materia con carga bajo el piso
 * no entra: todavía no hay nada publicado que leer ahí (mismo criterio que `careers-start-here.tsx`
 * del lado de instituciones). Si ninguna publica todavía, la sección no se dibuja.
 */
function StartHere({ activePlan }: { activePlan: ActivePlan }) {
  const coverageBySubjectId = new Map(
    activePlan.subjectCoverage.map((coverage) => [coverage.subjectId, coverage]),
  );

  const withReviews = activePlan.subjects
    .map((subject) => ({ subject, coverage: coverageBySubjectId.get(subject.id) }))
    .filter(
      (entry): entry is { subject: Subject; coverage: SubjectCoverage } =>
        entry.coverage?.isCovered ?? false,
    )
    .sort((a, b) => b.coverage.reviewCount - a.coverage.reviewCount);

  if (withReviews.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-[12px] text-ink-3">Por dónde empezar · las materias con reseñas</p>
      <div className="rounded-xl border border-line bg-bg-card px-4 py-[5px]">
        {withReviews.map(({ subject, coverage }, index) => (
          <div
            key={subject.id}
            className={cn('py-2.5', index !== withReviews.length - 1 && 'border-b border-line-2')}
          >
            <Link
              href={`/subjects/${subject.id}`}
              // Sin prefetch: la ficha es `force-dynamic` sin loading.tsx (ver subject-grid.tsx).
              prefetch={false}
              className="text-[13.5px] text-ink underline-offset-2 hover:underline"
            >
              {subject.name}
            </Link>
            <p className="mt-1 text-[11px] text-ink-3">{describeSubjectCoverage(coverage)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ reviewHref }: { reviewHref: string }) {
  return (
    <Link
      href={reviewHref}
      className="block rounded-lg bg-ink px-3.5 py-[9px] text-center text-[13px] font-medium text-bg-card"
    >
      Reseñá tu cursada
    </Link>
  );
}
