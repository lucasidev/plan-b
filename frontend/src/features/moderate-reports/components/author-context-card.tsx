import { cn } from '@/lib/utils';
import type { ReportDetail } from '../types';

/**
 * "Cuenta desde" a partir de la fecha de alta del autor. El mockup muestra el cuatrimestre académico
 * (ej. "2024-1c"); el backend no lo deriva, así que se muestra mes + año de la cuenta.
 */
function accountSince(iso: string | null): string {
  if (!iso) {
    return 'sin dato';
  }
  return new Date(iso).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mr-1.5 text-ink-4">{label}:</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  );
}

/**
 * Card "Contexto del autor" del detalle (US-051), full width debajo del grid. Stats agregadas para que
 * el moderador detecte patrones (reincidencia, reportes recibidos). Identidad visible al staff
 * (ADR-0009). Los strikes son US-085, no se muestran acá.
 */
export function AuthorContextCard({ detail }: { detail: ReportDetail }) {
  return (
    <section className="mt-3.5 rounded-lg border border-line bg-bg-card p-4">
      <header className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="m-0 font-display text-[14px] font-semibold text-ink">Contexto del autor</h3>
        <small className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-4">
          {detail.authorUserId ? detail.authorUserId.slice(0, 8) : 'desconocido'} · anónimo público
        </small>
      </header>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12.5px]">
        <Stat label="Cuenta desde">{accountSince(detail.authorAccountSince)}</Stat>
        <Stat label="Reseñas escritas">{detail.authorReviewsWritten}</Stat>
        <Stat label="Reportes recibidos">{detail.authorReportsReceived}</Stat>
        <Stat label="Estado">
          <span
            className={cn(
              'rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em]',
              detail.authorBanned
                ? 'bg-st-failed-bg text-st-failed-fg'
                : 'bg-st-approved-bg text-st-approved-fg',
            )}
          >
            {detail.authorBanned ? 'BANEADO' : 'ACTIVO'}
          </span>
        </Stat>
      </div>
    </section>
  );
}
