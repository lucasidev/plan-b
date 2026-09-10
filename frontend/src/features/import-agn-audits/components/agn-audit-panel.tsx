'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { formatShortDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { importAgnAuditsAction } from '../actions';
import type { AgnAuditRow } from '../types';

const GRID = 'minmax(0,1fr) 132px minmax(0,1.4fr) 116px';

/**
 * Auditorías de la AGN, por institución (issue #506). Sofía dispara la consulta a mano desde acá;
 * la pantalla dice cuándo se consultó por última vez y qué encontró, sacado de las afirmaciones que
 * ya existen (no hay un registro de "última consulta" aparte). Mutación pura (ADR-0046): el action
 * hace el POST y esta pantalla refresca la RSC para traer el detalle actualizado.
 */
export function AgnAuditPanel({ items }: { items: AgnAuditRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  );

  function runImport() {
    setFeedback(null);
    startTransition(async () => {
      const result = await importAgnAuditsAction();
      if (result.status === 'success') {
        setFeedback({
          kind: 'success',
          message: `Se consultaron ${result.auditsLoaded} instituciones.`,
        });
        router.refresh();
      } else if (result.status === 'error') {
        setFeedback({ kind: 'error', message: result.message });
      }
    });
  }

  const checkedCount = items.filter((i) => i.checked).length;
  const withReports = items.filter((i) => i.status === 'Published').length;
  const withoutReports = items.filter((i) => i.status === 'NotPublished').length;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="m-0 font-display text-[16px] font-semibold text-ink">
            Auditorías de la AGN
          </h2>
          <p className="mt-1 mb-0 text-[12.5px] text-ink-3">
            {checkedCount > 0
              ? `${checkedCount} de ${items.length} instituciones consultadas, ${withReports} con informes y ${withoutReports} sin informes.`
              : 'Todavía no se consultó ninguna institución.'}
          </p>
        </div>
        <button
          type="button"
          onClick={runImport}
          disabled={isPending}
          className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-pill border border-line bg-bg-card px-3.5 text-[12.5px] font-medium text-ink shadow-card transition-colors hover:bg-bg-elev disabled:opacity-50"
        >
          {isPending ? 'Consultando...' : 'Actualizar auditorías AGN'}
        </button>
      </div>
      {feedback && (
        <p
          className={cn(
            'mb-3 text-[12.5px]',
            feedback.kind === 'error' ? 'text-st-failed-fg' : 'text-st-approved-fg',
          )}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      )}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-bg-card px-6 py-12 text-center">
          <p className="m-0 text-[13px] text-ink-3">Todavía no hay instituciones en el catálogo.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-bg-card text-[12.5px]">
          <div
            className="grid items-center gap-3.5 border-b border-line bg-bg-elev px-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
            style={{ gridTemplateColumns: GRID, height: 32 }}
          >
            <div>Institución</div>
            <div>Estado</div>
            <div>Informe</div>
            <div>Última consulta</div>
          </div>
          {items.map((item) => (
            <AgnAuditItemRow key={item.universityId} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgnAuditItemRow({ item }: { item: AgnAuditRow }) {
  return (
    <div
      className="grid items-center gap-3.5 border-b border-line-2 px-3.5 py-2 last:border-b-0"
      style={{ gridTemplateColumns: GRID }}
    >
      <div className="truncate font-medium text-ink">{item.universityName}</div>
      <div>
        <AgnAuditStatusBadge item={item} />
      </div>
      <div className="truncate text-ink-2">
        {item.status === 'Published' && item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent-ink underline-offset-2 hover:underline"
          >
            {item.value}
            {item.period ? ` (${item.period})` : ''}
          </a>
        ) : (
          <span className="text-ink-4">{item.checked ? 'sin informes' : 'sin consultar'}</span>
        )}
      </div>
      <div className="text-ink-2">
        {item.lastCheckedAt ? (
          formatShortDate(item.lastCheckedAt)
        ) : (
          <span className="text-ink-4">sin consultar</span>
        )}
      </div>
    </div>
  );
}

function AgnAuditStatusBadge({ item }: { item: AgnAuditRow }) {
  if (!item.checked) {
    return <Badge tone="pending">SIN CONSULTAR</Badge>;
  }
  if (item.status === 'Published') {
    return <Badge tone="approved">CON INFORMES</Badge>;
  }
  return <Badge tone="pending">SIN INFORMES</Badge>;
}

function Badge({ tone, children }: { tone: 'approved' | 'pending'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em]',
        tone === 'approved'
          ? 'bg-st-approved-bg text-st-approved-fg'
          : 'bg-st-pending-bg text-st-pending-fg',
      )}
    >
      {children}
    </span>
  );
}
