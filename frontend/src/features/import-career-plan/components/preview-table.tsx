'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { approveCareerPlanAction } from '../actions';
import {
  type ApproveCareerPlanState,
  type ApproveSubjectItem,
  type CareerPlanImportPayload,
  initialApproveCareerPlanState,
  type ParsedSubjectItem,
} from '../types';

type Props = {
  importId: string;
  universityId: string;
  careerName: string;
  planYear: number;
  enrollmentYear: number;
  payload: CareerPlanImportPayload;
};

type EditableRow = {
  index: number;
  selected: boolean;
  parsed: ParsedSubjectItem;
  code: string;
  name: string;
  yearInPlan: string;
  termInYear: string;
  termKind: string;
};

/**
 * Tabla editable del preview del plan. Cada fila parseada se renderiza con campos editables;
 * al confirmar se materializa el plan (Career + CareerPlan + Subjects). Al éxito redirige a
 * /onboarding/career?planId={nuevo} para que el alumno complete el paso 2.
 */
export function CareerPlanPreviewTable({
  importId,
  universityId,
  careerName,
  planYear,
  enrollmentYear,
  payload,
}: Props) {
  const router = useRouter();

  const initialRows = useMemo<EditableRow[]>(
    () =>
      payload.items.map((p) => ({
        index: p.index,
        selected: !!p.detectedCode && p.confidence !== 'Low',
        parsed: p,
        code: p.detectedCode ?? '',
        name: p.detectedName ?? '',
        yearInPlan: p.detectedYearInPlan != null ? String(p.detectedYearInPlan) : '1',
        termInYear: p.detectedTermInYear != null ? String(p.detectedTermInYear) : '',
        termKind: p.detectedTermKind ?? 'Cuatrimestral',
      })),
    [payload.items],
  );

  const [rows, setRows] = useState<EditableRow[]>(initialRows);

  const [state, formAction] = useActionState<ApproveCareerPlanState, FormData>(
    handleApproveAction(router, universityId, enrollmentYear),
    initialApproveCareerPlanState,
  );

  const selectedRows = rows.filter((r) => r.selected && r.code.trim() && r.name.trim());
  const error = state.status === 'error' ? state.message : null;

  function update(index: number, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((r) => (r.index === index ? { ...r, ...patch } : r)));
  }

  const itemsForSubmit: ApproveSubjectItem[] = selectedRows.map((r) => ({
    code: r.code.trim().toUpperCase(),
    name: r.name.trim(),
    yearInPlan: Number.parseInt(r.yearInPlan, 10) || 1,
    termInYear:
      r.termKind === 'Anual' ? null : r.termInYear.trim() ? Number.parseInt(r.termInYear, 10) : 1,
    termKind: r.termKind,
  }));

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <input type="hidden" name="importId" value={importId} />
      <input type="hidden" name="items" value={JSON.stringify(itemsForSubmit)} />

      <div
        className="text-ink-3 border border-line rounded bg-bg-card"
        style={{ padding: 12, marginBottom: 12, fontSize: 13 }}
      >
        Plan: <strong className="text-ink">{careerName}</strong> · año{' '}
        <strong className="text-ink">{planYear}</strong>
      </div>

      <SummaryRow payload={payload} selectedCount={selectedRows.length} />

      <div className="overflow-x-auto border border-line rounded" style={{ marginBottom: 16 }}>
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead className="bg-bg-card text-ink-2" style={{ fontSize: 12 }}>
            <tr>
              <Th>Sel</Th>
              <Th>Código</Th>
              <Th>Materia</Th>
              <Th>Año</Th>
              <Th>Cuatri</Th>
              <Th>Modalidad</Th>
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
                    onChange={(e) => update(r.index, { selected: e.target.checked })}
                    aria-label={`Importar item ${r.index + 1}`}
                  />
                </Td>
                <Td>
                  <input
                    type="text"
                    value={r.code}
                    onChange={(e) => update(r.index, { code: e.target.value })}
                    className={inputClass}
                    style={{ ...inputStyle, width: 90 }}
                  />
                </Td>
                <Td>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => update(r.index, { name: e.target.value })}
                    className={inputClass}
                    style={{ ...inputStyle, width: 260 }}
                  />
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
                  <input
                    type="number"
                    value={r.yearInPlan}
                    onChange={(e) => update(r.index, { yearInPlan: e.target.value })}
                    min={1}
                    max={10}
                    className={inputClass}
                    style={{ ...inputStyle, width: 60 }}
                  />
                </Td>
                <Td>
                  {r.termKind === 'Anual' ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <input
                      type="number"
                      value={r.termInYear}
                      onChange={(e) => update(r.index, { termInYear: e.target.value })}
                      min={1}
                      max={6}
                      className={inputClass}
                      style={{ ...inputStyle, width: 60 }}
                    />
                  )}
                </Td>
                <Td>
                  <select
                    value={r.termKind}
                    onChange={(e) => update(r.index, { termKind: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="Cuatrimestral">Cuatrimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
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

function handleApproveAction(
  router: ReturnType<typeof useRouter>,
  universityId: string,
  enrollmentYear: number,
): (prev: ApproveCareerPlanState, formData: FormData) => Promise<ApproveCareerPlanState> {
  return async (prev, formData) => {
    const next = await approveCareerPlanAction(prev, formData);
    if (next.status === 'success') {
      // Redirect al onboarding/career con el nuevo plan pre-seleccionado. Pasamos
      // universityId + careerId además del planId para que el form pueda restaurar el
      // state exacto sin tener que adivinar (la career nueva puede convivir con la
      // oficial cuando ya existía una carrera con el mismo nombre).
      queueMicrotask(() => {
        const successState = next as Extract<typeof next, { status: 'success' }>;
        const qs = new URLSearchParams({
          universityId,
          careerId: successState.careerId,
          planId: successState.careerPlanId,
          enrollmentYear: String(enrollmentYear),
        });
        router.push(`/onboarding/career?${qs.toString()}`);
      });
    }
    return next;
  };
}

function SummaryRow({
  payload,
  selectedCount,
}: {
  payload: CareerPlanImportPayload;
  selectedCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-3 text-ink-3" style={{ fontSize: 12, marginBottom: 12 }}>
      <span>
        Detectadas: <strong className="text-ink">{payload.summary.totalDetected}</strong>
      </span>
      <span>
        Alta: <strong className="text-ink">{payload.summary.highConfidence}</strong>
      </span>
      <span>
        Media: <strong className="text-ink">{payload.summary.mediumConfidence}</strong>
      </span>
      <span>
        Baja: <strong className="text-ink">{payload.summary.lowConfidence}</strong>
      </span>
      <span>
        · Seleccionadas: <strong className="text-ink">{selectedCount}</strong>
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
        ? 'Creando el plan...'
        : count === 0
          ? 'Elegí al menos una materia'
          : `Crear plan con ${count} materia${count === 1 ? '' : 's'}`}
    </button>
  );
}
