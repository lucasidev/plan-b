import Link from 'next/link';
import type { EnrollmentStatus, TranscriptPeriod } from '@/features/my-career/types';
import { cn } from '@/lib/utils';

/**
 * Placeholder de "sin nota" (ver ADR-0054: una métrica sin sustento viaja null, nunca
 * 0). Constante aparte para no repetir el carácter directamente en el código fuente.
 */
const NO_GRADE_PLACEHOLDER = String.fromCharCode(8212);

/**
 * Card de un período del historial (US-045-e). Puerto del bloque que el canvas
 * renderea para cada item de `V2_HIST`, ahora sobre los datos reales del backend.
 *
 * Header: label del período en mono (o "Sin período" para el grupo de equivalencias,
 * que llega con `label: null`) más el subtítulo "N materias" (con "· promedio X.X"
 * solo cuando el período tiene alguna nota real). Body: mini-grid de 6 columnas, una
 * fila por cursada.
 *
 * Server component (sin interacción propia). La última columna es el link a editar esa
 * cursada (US-015-f): el historial mostraba el dato equivocado en pantalla y no había
 * forma de arreglarlo.
 */
export function HistoryPeriodCard({ period }: { period: TranscriptPeriod }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg shadow-card p-5">
      <div className="flex justify-between items-baseline mb-2.5">
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-mono font-semibold text-ink"
            style={{ fontSize: 13.5, letterSpacing: '0.02em' }}
          >
            {period.label ?? 'Sin período'}
          </span>
          <span className="text-[11.5px] text-ink-3">
            {`${period.items.length} ${period.items.length === 1 ? 'materia' : 'materias'}`}
            {period.average !== null ? ` · promedio ${period.average.toFixed(1)}` : null}
          </span>
        </div>
      </div>

      {/* La columna del chip mide 100px (no 90px): "abandonada", la más larga de las
          cinco palabras de estado, no entraba sin desbordar. La última pasó de 30px a
          52px cuando el placeholder visual se volvió el link "Editar". */}
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr 110px 100px 60px 52px' }}>
        {period.items.map((item, idx) => {
          const borderClass = idx === 0 ? '' : 'border-t border-line';
          return (
            <div key={item.subjectCode} className="contents">
              <div className={cn('py-2.5 font-mono text-[10.5px] text-ink-3', borderClass)}>
                {item.subjectCode}
              </div>
              <div className={cn('py-2.5 text-[13px] font-medium text-ink', borderClass)}>
                {item.subjectName}
              </div>
              <div className={cn('py-2.5 text-[11px] text-ink-3', borderClass)}>
                {item.teacherLastName ? `con ${item.teacherLastName}` : null}
              </div>
              <div className={cn('py-2.5', borderClass)}>
                <StateChip status={item.status} />
              </div>
              <div
                className={cn(
                  'py-2.5 font-mono font-semibold text-right',
                  borderClass,
                  item.grade !== null ? 'text-ink' : 'text-ink-3',
                )}
                style={{ fontSize: 14 }}
              >
                {item.grade ?? NO_GRADE_PLACEHOLDER}
              </div>
              <div className={cn('py-2.5 text-right', borderClass)}>
                {/* Sin prefetch: la ruta de edición es dinámica y cada visita resuelve historial,
                    plan y reseñas propias. Con el default, un alumno con treinta materias dispara
                    treinta prefetches de eso apenas abre el historial, para una acción que casi
                    siempre no va a usar. */}
                <Link
                  href={`/my-career/transcript/${item.id}/edit`}
                  prefetch={false}
                  className="text-ink-3 hover:text-accent-ink transition-colors"
                  style={{ fontSize: 11.5 }}
                  aria-label={`Editar ${item.subjectName}`}
                >
                  Editar
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Los cinco estados reales de `EnrollmentStatus` (glosario en
 * `docs/domain/ubiquitous-language.md`). Aprobada y reprobada mantienen los dos
 * colores que el canvas ya definía. Regular y cursando usan los mismos valores oklch
 * que ya viven en `globals.css` (`st-regularized`, `st-coursing`), copiados acá
 * inline porque este chip entero ya se arma con estilos inline, no utilities de
 * Tailwind. Abandonada no tenía token propio: no es un logro, ni un fracaso, ni algo
 * en curso, es simplemente inerte, así que usa un gris neutro con el mismo patrón
 * oklch que el resto.
 */
const STATUS_CHIP: Record<EnrollmentStatus, { label: string; bg: string; fg: string }> = {
  Passed: { label: 'aprobada', bg: 'oklch(0.94 0.05 145)', fg: 'oklch(0.42 0.09 145)' },
  Regularized: { label: 'regular', bg: 'oklch(0.94 0.04 200)', fg: 'oklch(0.42 0.09 220)' },
  InProgress: { label: 'cursando', bg: 'oklch(0.93 0.06 70)', fg: 'oklch(0.45 0.12 60)' },
  Failed: { label: 'reprobada', bg: 'oklch(0.93 0.05 50)', fg: 'oklch(0.45 0.13 50)' },
  Dropped: { label: 'abandonada', bg: 'oklch(0.90 0.008 80)', fg: 'oklch(0.48 0.01 80)' },
};

function StateChip({ status }: { status: EnrollmentStatus }) {
  const { label, bg, fg } = STATUS_CHIP[status];
  return (
    <span
      className="font-mono text-[10.5px] inline-flex"
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        letterSpacing: '0.03em',
        background: bg,
        color: fg,
      }}
    >
      {label}
    </span>
  );
}
