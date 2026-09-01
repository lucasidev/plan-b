import Link from 'next/link';
import { CatalogTopbar } from '@/features/browse-catalog';
import type { CareerFacts } from '../types';

/**
 * La ficha de una carrera (SC-001, US-127, US-134, ADR-0085).
 *
 * Alcance acotado a lo que tiene fuente real hoy: identidad, cuánto dura en el papel (la otra
 * mitad de US-127, "dura en la realidad" y el egreso por cohorte, es relevamiento propio que
 * todavía no existe) y la cobertura (US-134, siempre a la vista, nunca oculta detrás de un
 * umbral). "Qué frena la cursada" y la nota de curaduría necesitan un corpus de reseñas que hoy es
 * cero: no se mockean ni se dejan con un placeholder de números falsos.
 *
 * Lo que no muestra nunca: ningún puntaje ni escala, ningún dato oficial sin decir que falta.
 */
export function CareerFactsSheet({ facts }: { facts: CareerFacts }) {
  return (
    <div data-surface="bulletin" className="min-h-screen w-full">
      {/* Con el topbar, porque una ficha sin él es una calle sin salida: se llega desde la
          búsqueda y no hay cómo seguir buscando ni volver. */}
      <CatalogTopbar />
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <Identity facts={facts} />
        <OfficialData facts={facts} />
        <Coverage facts={facts} />
        <EditorialNotes facts={facts} />
        <Footer facts={facts} />
      </div>
    </div>
  );
}

function Identity({ facts }: { facts: CareerFacts }) {
  return (
    <div className="mb-[18px]">
      <h1 className="mb-0.5 font-serif text-[24px] font-semibold text-ink">{facts.careerName}</h1>
      <p className="text-[13px] text-ink-2">{facts.universityName}</p>
    </div>
  );
}

/**
 * Datos oficiales: hoy solo llega cuánto dura en el papel (US-127). El resto (cuánto dura en la
 * realidad, egreso por cohorte) es relevamiento propio que todavía no existe, así que el bloque lo
 * dice en vez de mostrar un espacio vacío sin explicación.
 */
function OfficialData({ facts }: { facts: CareerFacts }) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Datos oficiales</p>
      <div className="rounded-xl border border-line bg-bg-card p-4">
        {facts.durationYears !== null ? (
          <>
            <p className="mb-1 text-[12px] text-ink-3">Dura en el papel</p>
            <p className="mb-2 font-serif text-[20px] font-medium text-ink">
              {facts.durationYears} {facts.durationYears === 1 ? 'año' : 'años'}
            </p>
            <p className="text-[12px] leading-relaxed text-ink-3">
              De fuente oficial, todavía no tenemos cuánto dura en la realidad ni cuánto egresa por
              cohorte.
            </p>
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-3">
            Todavía no tenemos datos oficiales de esta carrera.
          </p>
        )}
      </div>
    </section>
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
              <span className="font-mono"> · {formatNoteDate(note.publishedAt)}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** La fecha de la nota, al día: la hora no aporta nada a leer una síntesis. */
function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function Footer({ facts }: { facts: CareerFacts }) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/careers/${facts.careerId}/plans`}
        className="flex-1 rounded-lg border border-line bg-bg-card px-3.5 py-[9px] text-center text-[13px] text-ink"
      >
        Ver las {facts.totalSubjects} {facts.totalSubjects === 1 ? 'materia' : 'materias'}
      </Link>
      <Link
        href="/reviews/new"
        className="flex-1 rounded-lg bg-ink px-3.5 py-[9px] text-center text-[13px] font-medium text-bg-card"
      >
        Reseñá tu cursada
      </Link>
    </div>
  );
}
