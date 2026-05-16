'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { confirmHistorialAction } from '../actions';
import type {
  ConfirmedItem,
  ConfirmHistorialState,
  HistorialImportPayload,
  ParsedItem,
} from '../types';
import { initialConfirmHistorialState } from '../types';

type Props = {
  importId: string;
  payload: HistorialImportPayload;
};

type EditableRow = {
  index: number;
  selected: boolean;
  /** Solo los items con subjectId resuelto pueden importarse. */
  parsed: ParsedItem;
  status: string;
  approvalMethod: string;
  grade: string;
  termId: string;
};

/**
 * Tabla editable del preview. Cada fila parseada se renderiza con:
 *  - checkbox de selección (default: marcado si confidence != Low y hay subjectId resuelto)
 *  - status (select)
 *  - approvalMethod (select, opcional)
 *  - grade (input)
 *  - confidence badge + issues
 *
 * Al confirmar, solo se envían filas seleccionadas con subjectId no-null.
 */
export function PreviewTable({ importId, payload }: Props) {
  const initialRows = useMemo<EditableRow[]>(
    () =>
      payload.items.map((p) => ({
        index: p.index,
        // Default: seleccionado si lo pudimos resolver y la confianza no es baja.
        selected: !!p.subjectId && p.confidence !== 'Low',
        parsed: p,
        status: normalizeStatus(p.detectedStatus),
        approvalMethod: normalizeApprovalMethod(p.detectedApprovalMethod),
        grade: p.detectedGrade != null ? String(p.detectedGrade) : '',
        termId: p.termId ?? '',
      })),
    [payload.items],
  );

  const [rows, setRows] = useState<EditableRow[]>(initialRows);

  const [state, formAction] = useActionState<ConfirmHistorialState, FormData>(
    confirmHistorialAction,
    initialConfirmHistorialState,
  );

  const selectedRows = rows.filter((r) => r.selected && r.parsed.subjectId);
  const error = state.status === 'error' ? state.message : null;

  function update(index: number, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((r) => (r.index === index ? { ...r, ...patch } : r)));
  }

  const itemsForSubmit: ConfirmedItem[] = selectedRows.map((r) => ({
    subjectId: r.parsed.subjectId as string,
    termId: r.termId || null,
    status: r.status,
    approvalMethod: r.status === 'Aprobada' ? r.approvalMethod : null,
    grade: r.grade.trim() !== '' ? Number.parseFloat(r.grade) : null,
  }));

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <input type="hidden" name="importId" value={importId} />
      <input type="hidden" name="items" value={JSON.stringify(itemsForSubmit)} />

      <SummaryRow payload={payload} selectedCount={selectedRows.length} />

      <div className="overflow-x-auto border border-line rounded" style={{ marginBottom: 16 }}>
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead className="bg-bg-card text-ink-2" style={{ fontSize: 12 }}>
            <tr>
              <Th>Sel</Th>
              <Th>Materia detectada</Th>
              <Th>Estado</Th>
              <Th>Forma</Th>
              <Th>Nota</Th>
              <Th>Confianza</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.index} className="border-t border-line">
                <Td>
                  <input
                    type="checkbox"
                    checked={r.selected}
                    disabled={!r.parsed.subjectId}
                    onChange={(e) => update(r.index, { selected: e.target.checked })}
                    aria-label={`Importar item ${r.index + 1}`}
                  />
                </Td>
                <Td>
                  <div className="text-ink" style={{ fontWeight: 500 }}>
                    {r.parsed.subjectName ?? r.parsed.detectedCode ?? '—'}
                  </div>
                  <div className="text-ink-3" style={{ fontSize: 11 }}>
                    {r.parsed.detectedCode ?? 'sin código'}
                    {r.parsed.termLabel ? ` · ${r.parsed.termLabel}` : ''}
                  </div>
                  {r.parsed.issues.length > 0 && (
                    <ul
                      className="text-st-failed-fg"
                      style={{ fontSize: 11, marginTop: 4, paddingLeft: 12 }}
                    >
                      {r.parsed.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </Td>
                <Td>
                  <select
                    value={r.status}
                    onChange={(e) => update(r.index, { status: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="Aprobada">Aprobada</option>
                    <option value="Regular">Regular</option>
                    <option value="Cursando">Cursando</option>
                    <option value="Reprobada">Reprobada</option>
                    <option value="Abandonada">Abandonada</option>
                  </select>
                </Td>
                <Td>
                  {r.status === 'Aprobada' ? (
                    <select
                      value={r.approvalMethod}
                      onChange={(e) => update(r.index, { approvalMethod: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                    >
                      <option value="Cursada">Cursada</option>
                      <option value="Promocion">Promoción</option>
                      <option value="Final">Final</option>
                      <option value="FinalLibre">Final libre</option>
                      <option value="Equivalencia">Equivalencia</option>
                    </select>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </Td>
                <Td>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    max={10}
                    value={r.grade}
                    onChange={(e) => update(r.index, { grade: e.target.value })}
                    className={inputClass}
                    style={{ ...inputStyle, width: 80 }}
                  />
                </Td>
                <Td>
                  <ConfidenceBadge confidence={r.parsed.confidence} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          {error}
        </p>
      )}

      <SubmitButton disabled={selectedRows.length === 0} count={selectedRows.length} />
    </form>
  );
}

function SummaryRow({
  payload,
  selectedCount,
}: {
  payload: HistorialImportPayload;
  selectedCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-3 text-ink-3" style={{ fontSize: 12, marginBottom: 12 }}>
      <span>
        Detectadas: <strong className="text-ink">{payload.summary.totalDetected}</strong>
      </span>
      <span>
        Confianza alta: <strong className="text-ink">{payload.summary.highConfidence}</strong>
      </span>
      <span>
        Media: <strong className="text-ink">{payload.summary.mediumConfidence}</strong>
      </span>
      <span>
        Baja: <strong className="text-ink">{payload.summary.lowConfidence}</strong>
      </span>
      <span>
        · Seleccionadas para importar: <strong className="text-ink">{selectedCount}</strong>
      </span>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'Low' | 'Medium' | 'High' }) {
  const map = {
    High: { label: 'alta', cls: 'text-st-approved-fg' },
    Medium: { label: 'media', cls: 'text-ink-2' },
    Low: { label: 'baja', cls: 'text-st-failed-fg' },
  } as const;
  const { label, cls } = map[confidence];
  return (
    <span
      className={cn('inline-flex items-center border border-line rounded-pill bg-bg-card', cls)}
      style={{ padding: '2px 8px', fontSize: 11, fontWeight: 500 }}
    >
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left" style={{ padding: '8px 10px', fontWeight: 600 }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="align-top" style={{ padding: '8px 10px' }}>
      {children}
    </td>
  );
}

const inputClass = cn(
  'bg-bg-card text-ink border border-line rounded',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
);

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 12.5,
  fontFamily: 'inherit',
};

function SubmitButton({ disabled, count }: { disabled: boolean; count: number }) {
  const { pending } = useFormStatus();
  const blocked = disabled || pending;
  return (
    <button
      type="submit"
      disabled={blocked}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2',
        'bg-accent text-white border border-accent rounded-pill shadow-card',
        'transition-colors hover:bg-accent-hover',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {pending
        ? 'Confirmando...'
        : count === 0
          ? 'Elegí al menos una materia'
          : `Importar ${count} materia${count === 1 ? '' : 's'}`}
    </button>
  );
}

/** Normaliza al enum del backend si el detectado es válido; sino default a Aprobada. */
function normalizeStatus(detected: string | null): string {
  const allowed = ['Aprobada', 'Regular', 'Cursando', 'Reprobada', 'Abandonada'];
  if (detected && allowed.includes(detected)) return detected;
  return 'Aprobada';
}

function normalizeApprovalMethod(detected: string | null): string {
  const allowed = ['Cursada', 'Promocion', 'Final', 'FinalLibre', 'Equivalencia'];
  if (detected && allowed.includes(detected)) return detected;
  // Default conservador: Cursada (regular + final). Si el alumno aprobó por algo
  // distinto puede cambiarlo.
  return 'Cursada';
}
