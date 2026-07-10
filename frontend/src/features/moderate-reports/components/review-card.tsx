import { reviewStatusLabel } from '../reasons';
import type { ReportDetail } from '../types';

/** Un rating de la reseña (dificultad / general). Muestra estrellas + N/5, o "sin dato" si es null. */
function Rating({ label, value }: { label: string; value: number | null }) {
  return (
    <span>
      {label}:{' '}
      {value == null ? (
        <span className="text-ink-4">sin dato</span>
      ) : (
        <span className="text-ink">
          {'★'.repeat(value)}
          {'☆'.repeat(Math.max(0, 5 - value))} {value}/5
        </span>
      )}
    </span>
  );
}

/**
 * Card "Reseña reportada" del detalle (US-051): el contenido que el moderador tiene que leer para
 * decidir. El cuerpo son los dos campos de prosa de la reseña (subjectText = sobre la materia,
 * teacherText = sobre el docente); el backend no marca el fragmento reportado con offsets, así que no
 * hay highlight. Si la reseña ya está removed/deleted, banner de aviso (solo dismiss disponible).
 */
export function ReviewCard({ detail }: { detail: ReportDetail }) {
  const removed = detail.reviewStatus === 'Removed' || detail.reviewStatus === 'Deleted';
  const hasText = Boolean(detail.subjectText || detail.teacherText);

  return (
    <section className="rounded-lg border border-line bg-bg-card p-4">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="m-0 font-display text-[14px] font-semibold text-ink">Reseña reportada</h3>
        <small className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">
          {detail.reviewId.slice(0, 8)} · {reviewStatusLabel(detail.reviewStatus)}
        </small>
      </header>

      {removed && (
        <p className="mb-2.5 rounded-md bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
          La reseña ya no está visible ({reviewStatusLabel(detail.reviewStatus)}). Solo podés
          desestimar el reporte con una nota.
        </p>
      )}

      <p className="mb-2 text-[11.5px] text-ink-3">
        Anónimo en público · autor visible al staff abajo
      </p>

      <div className="space-y-2 text-[13px] leading-relaxed text-ink">
        {detail.subjectText && <p className="m-0">{detail.subjectText}</p>}
        {detail.teacherText && <p className="m-0">{detail.teacherText}</p>}
        {!hasText && <p className="m-0 text-ink-4">La reseña no tiene texto.</p>}
      </div>

      {detail.details && (
        <p className="mt-3 rounded-md bg-bg-elev px-3 py-2 text-[12px] text-ink-2">
          <span className="font-medium">Nota del reporte:</span> {`"${detail.details}"`}
        </p>
      )}

      <footer className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-2 pt-2.5 text-[12px] text-ink-3">
        <Rating label="Dificultad" value={detail.difficultyRating} />
        <Rating label="General" value={detail.overallRating} />
      </footer>
    </section>
  );
}
