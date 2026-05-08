import type { PendingReview } from '../data/to-review';

type Props = {
  reviews: PendingReview[];
  /** Año del período actual (típicamente `currentPeriod.year`). Se usa para el copy del header. */
  year: number;
};

/**
 * Bloque "Reseñá lo que cursaste" del Inicio v2. Card acent (gradient
 * desde accent-soft hacia bg-card) con materias cerradas pendientes de
 * reseña. Port literal de las líneas 191-232 del mock V2Inicio.
 *
 * Cada item es una sub-card con código + cuatri cerrado + nombre +
 * profesor + nota, con CTA "Reseñar →" deshabilitado hasta que aterrice
 * US-017 (escribir reseña).
 *
 * El año del header viene del `currentPeriod` (el cuatri pasado a
 * reseñar es el del año anterior). Hardcodear ese cálculo en el
 * componente sería un acoplamiento innecesario al período.
 */
export function PendingReviewsCard({ reviews, year }: Props) {
  return (
    <div
      className="bg-bg-card border rounded shadow-card p-5"
      style={{
        background:
          'linear-gradient(180deg, var(--color-accent-soft) 0%, var(--color-bg-card) 100%)',
        borderColor: 'oklch(0.85 0.07 55)',
      }}
    >
      <div className="font-mono text-[10.5px] text-accent-ink tracking-[0.08em] uppercase mb-2">
        Reseñá lo que cursaste
      </div>

      {reviews.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic mt-2">
          Cuando cierres una materia te avisamos para reseñarla.
        </p>
      ) : (
        <>
          <div className="text-[15px] font-medium leading-snug text-ink mb-[14px]">
            {reviews.length} materias cerradas en {year - 1} esperando tu opinión.
          </div>
          <div className="flex flex-col gap-2">
            {reviews.map((r) => (
              <div
                key={r.code}
                className="flex justify-between items-center bg-bg-card border border-line rounded-lg px-3 py-[9px]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-[7px] mb-[2px]">
                    <span className="font-mono text-[10px] text-ink-3">{r.code}</span>
                    <span className="font-mono text-[10px] text-ink-3">· {r.closed}</span>
                  </div>
                  <div className="text-[12.5px] text-ink font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    {r.name}
                  </div>
                  <div className="text-[10.5px] text-ink-3">
                    {r.prof} {r.note !== null ? `· nota ${r.note}` : '· sin nota'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  title="Próximamente"
                  className="px-[10px] py-[5px] text-[11.5px] font-medium border border-line rounded text-ink-3 ml-[10px] flex-shrink-0 cursor-not-allowed"
                >
                  Reseñar →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
