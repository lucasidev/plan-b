import Link from 'next/link';
import {
  CAREER_OFFICIAL_FACT_ORDER,
  MissingFactRow,
  OFFICIAL_FACT_FIELDS,
  OFFICIAL_FACT_LABELS,
  type OfficialFact,
  OfficialFactRow,
} from '@/components/facts';
import { CatalogTopbar } from '@/features/browse-catalog';
import { formatShortDate } from '@/lib/format-date';
import type { CareerFacts } from '../types';

/**
 * La ficha de una carrera (SC-001, US-127, US-133, US-134, ADR-0085, ADR-0090).
 *
 * Identidad y cobertura salen de la ficha de reviews (`CareerFacts`); los seis datos oficiales
 * (ADR-0090) salen de un endpoint aparte de academic y viajan como prop separada: son afirmaciones
 * con su propia fuente, no un cálculo sobre reseñas. "Qué frena la cursada" y la nota de curaduría
 * necesitan un corpus de reseñas que hoy es cero: no se mockean ni se dejan con un placeholder de
 * números falsos.
 *
 * Lo que no muestra nunca: ningún puntaje ni escala, ningún dato oficial sin decir que falta.
 */
type Props = {
  facts: CareerFacts;
  officialFacts: OfficialFact[];
  /**
   * A dónde manda "Reseñá tu cursada" (US-229): sin sesión, directo al gate con el motivo, en
   * vez de a `/reviews/new` (que el guard de `(member)` redirigiría igual, pero sin decir para
   * qué). Lo decide la página (`reviewCtaHref`, que sabe si hay sesión); el default acá es el
   * camino directo, para no forzar a cada test a pasarlo.
   */
  reviewHref?: string;
};

export function CareerFactsSheet({ facts, officialFacts, reviewHref = '/reviews/new' }: Props) {
  return (
    <div className="min-h-screen w-full">
      {/* Con el topbar, porque una ficha sin él es una calle sin salida: se llega desde la
          búsqueda y no hay cómo seguir buscando ni volver. */}
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <Identity facts={facts} />
        <OfficialData officialFacts={officialFacts} />
        <CompareLink careerId={facts.careerId} />
        <Coverage facts={facts} />
        <EditorialNotes facts={facts} />
        <Footer facts={facts} reviewHref={reviewHref} />
      </div>
    </div>
  );
}

function Identity({ facts }: { facts: CareerFacts }) {
  return (
    <div className="mb-[18px]">
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">{facts.careerName}</h1>
      <p className="text-[13px] text-ink-2">
        {facts.academicUnitName
          ? `${facts.academicUnitName} · ${facts.universityName}`
          : facts.universityName}
      </p>
    </div>
  );
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
              <OfficialFactRow key={fact.id} fact={fact} last={last} />
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
    <p className="mb-5 text-[13px]">
      <Link
        href={`/careers/${careerId}/where-to-study`}
        className="text-accent-ink underline-offset-2 hover:underline"
      >
        Comparar con otras instituciones
      </Link>
    </p>
  );
}

/**
 * Cuánto de esta carrera está medido (US-134): siempre a la vista, nunca oculta detrás de un
 * umbral. El piso de 10 reseñas por cátedra es lo único que condiciona qué materia entra al "N".
 */
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
    return 'Todas sus materias ya juntan las 10 reseñas del piso.';
  }

  if (facts.coveredSubjects === 0) {
    return 'Ninguna materia junta todavía las 10 reseñas del piso.';
  }

  return `Las ${remaining} restantes todavía no juntan las 10 reseñas del piso.`;
}

function Footer({ facts, reviewHref }: { facts: CareerFacts; reviewHref: string }) {
  return (
    <div className="flex gap-2">
      {facts.totalSubjects > 0 && (
        <Link
          href={`/careers/${facts.careerId}/plans`}
          className="flex-1 rounded-lg border border-line bg-bg-card px-3.5 py-[9px] text-center text-[13px] text-ink"
        >
          Ver las {facts.totalSubjects} {facts.totalSubjects === 1 ? 'materia' : 'materias'}
        </Link>
      )}
      <Link
        href={reviewHref}
        className="flex-1 rounded-lg bg-ink px-3.5 py-[9px] text-center text-[13px] font-medium text-bg-card"
      >
        Reseñá tu cursada
      </Link>
    </div>
  );
}
