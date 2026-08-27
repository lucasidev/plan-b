'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
// El catálogo se consume del `api.ts` del alta y no se duplica acá: son los mismos endpoints y la
// misma queryKey, así que abrir el editor sobre una cursada recién cargada ni siquiera refetchea.
import { addEnrollmentQueries } from '@/features/add-enrollment/api';
import type { Commission } from '@/features/add-enrollment/types';
import { navigateAfterMutation } from '@/lib/navigate-after-mutation';
import { cn } from '@/lib/utils';
import { submitEditEnrollmentAction } from '../actions';
import {
  type EditEnrollmentFormState,
  type EnrollmentToEdit,
  initialEditEnrollmentState,
} from '../types';

type Props = {
  enrollment: EnrollmentToEdit;
  universityId: string;
};

/**
 * Form de edición de una cursada (US-015-f). Misma forma condicional que el alta (US-013-f), con
 * dos diferencias que vienen del hecho de estar editando y no creando:
 *
 *   1. La materia no está: el PATCH no la acepta. Cambiar de materia no es corregir una cursada.
 *   2. Ya no pide confirmación al volver a "cursando": esa advertencia existía porque la reseña
 *      del modelo anterior se anclaba a la cursada, y volver atrás la mandaba a revisión. La
 *      reseña vigente se ancla a cuenta, materia y período, así que editar la cursada no la toca.
 *
 * El backend revalida todo el juego de invariantes sobre el estado resultante; el form solo guía.
 */
export function EditEnrollmentForm({ enrollment, universityId }: Props) {
  const [state, formAction] = useActionState<EditEnrollmentFormState, FormData>(
    submitEditEnrollmentAction,
    initialEditEnrollmentState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const [status, setStatus] = useState<string>(enrollment.status);
  const [approvalMethod, setApprovalMethod] = useState<string>(
    enrollment.approvalMethod ?? 'Coursework',
  );
  const [termId, setTermId] = useState<string>(enrollment.termId ?? '');
  const [commissionId, setCommissionId] = useState<string>(enrollment.commissionId ?? '');

  const terms = useQuery(addEnrollmentQueries.academicTerms(universityId));

  const showApprovalMethod = status === 'Passed';
  const showGrade = status === 'Passed' || status === 'Regularized';
  const showTerm = !showApprovalMethod || approvalMethod !== 'CreditTransfer';

  const attendedCommission =
    (status === 'Passed' && ['Coursework', 'Promotion', 'FinalExam'].includes(approvalMethod)) ||
    ['Regularized', 'InProgress', 'Failed', 'Dropped'].includes(status);
  const showCommission = attendedCommission && !!termId;

  const commissions = useQuery(
    addEnrollmentQueries.commissions(
      showCommission ? enrollment.subjectId : null,
      showCommission ? termId : null,
    ),
  );

  // ADR-0046: el action es mutación pura y la navegación la hace el cliente cuando ve el status.
  // El porqué de `navigateAfterMutation` y no `router.push` está medido en su docstring.
  useEffect(() => {
    if (state.status !== 'success') return;
    navigateAfterMutation('/my-career?tab=transcript');
  }, [state.status]);

  const formError = state.status === 'error' ? state.message : null;
  const fieldError = state.status === 'error' ? state.field : undefined;

  if (terms.isError) {
    return <ErrorState onRetry={() => terms.refetch()} />;
  }

  if (terms.isLoading) {
    return <LoadingState />;
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col" noValidate>
      <input type="hidden" name="enrollmentId" value={enrollment.id} />

      <div
        className="border border-line rounded-lg bg-bg-card"
        style={{ padding: '12px 14px', marginBottom: 18 }}
      >
        <p className="font-mono text-ink-3" style={{ fontSize: 10.5, margin: '0 0 2px' }}>
          {enrollment.subjectCode}
        </p>
        <p className="text-ink" style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          {enrollment.subjectName}
        </p>
        <p className="text-ink-4" style={{ fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>
          La materia no se puede cambiar. Si cargaste la que no era, borrala y cargá la correcta.
        </p>
      </div>

      <Field id="status" label="Estado">
        <select
          id="status"
          name="status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="Passed">Aprobada</option>
          <option value="Regularized">Regular (regularicé, falta final)</option>
          <option value="InProgress">Cursando</option>
          <option value="Failed">Reprobada</option>
          <option value="Dropped">Abandonada</option>
        </select>
      </Field>

      {showApprovalMethod && (
        <Field id="approvalMethod" label="Forma de aprobación">
          <select
            id="approvalMethod"
            name="approvalMethod"
            required
            value={approvalMethod}
            onChange={(e) => setApprovalMethod(e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="Coursework">Cursada (regular + final)</option>
            <option value="Promotion">Promoción</option>
            <option value="FinalExam">Final</option>
            <option value="IndependentFinalExam">Final libre</option>
            <option value="CreditTransfer">Equivalencia</option>
          </select>
          {fieldError === 'approvalMethod' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {showTerm && (
        <Field id="term" label="Cuatrimestre">
          <select
            id="term"
            name="termId"
            required={status === 'InProgress' || approvalMethod === 'IndependentFinalExam'}
            className={selectClass}
            style={selectStyle}
            value={termId}
            onChange={(e) => {
              setTermId(e.target.value);
              // La comisión se identifica por (materia, cuatrimestre): la que estaba elegida no
              // existe en el cuatrimestre nuevo, así que se limpia en vez de viajar inválida.
              setCommissionId('');
            }}
          >
            <option value="">Elegí un cuatrimestre</option>
            {(terms.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {fieldError === 'termId' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {showCommission && (
        <Field id="commission" label="Comisión / cátedra">
          {commissions.isLoading ? (
            <p className="text-ink-3" style={{ fontSize: 13, padding: '2px 0' }}>
              Buscando comisiones…
            </p>
          ) : (commissions.data ?? []).length === 0 ? (
            <p className="text-ink-3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              No hay comisiones cargadas para esta materia y cuatrimestre. Podés guardar igual; vas
              a poder reseñarla cuando se cargue la comisión.
            </p>
          ) : (
            <select
              id="commission"
              name="commissionId"
              className={selectClass}
              style={selectStyle}
              value={commissionId}
              onChange={(e) => setCommissionId(e.target.value)}
            >
              <option value="">Elegí tu comisión</option>
              {(commissions.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {commissionLabel(c)}
                </option>
              ))}
            </select>
          )}
          {fieldError === 'commissionId' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {showGrade && (
        <Field id="grade" label="Nota final (0 a 10)">
          <input
            id="grade"
            name="grade"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={10}
            required={showGrade}
            className={selectClass}
            style={selectStyle}
            placeholder="7.5"
            defaultValue={enrollment.grade ?? ''}
            aria-label="Nota final (0 a 10)"
          />
          {fieldError === 'grade' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {formError && !fieldError && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          {formError}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

/** "Comisión A · Brandt, Sosa": nombre de la comisión + apellidos de sus docentes (ya en title case). */
function commissionLabel(commission: Commission): string {
  const teachers = commission.teachers.map((t) => t.lastName).join(', ');
  return teachers ? `${commission.name} · ${teachers}` : commission.name;
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={id}
        className="text-ink-2"
        style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-st-failed-fg" style={{ fontSize: 12, marginTop: 4 }}>
      {children}
    </p>
  );
}

const selectClass = cn(
  'w-full bg-bg-card text-ink border border-line rounded',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
  'disabled:opacity-50 disabled:cursor-not-allowed',
);

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  appearance: 'auto',
};

/**
 * Cuando la edición es destructiva el botón deja de enviar y abre la confirmación; el envío real lo
 * dispara el diálogo. Es `type="button"` en ese caso y no un submit interceptado con
 * `preventDefault` porque así el form nunca llega a enviarse sin que el alumno haya confirmado, ni
 * siquiera por Enter en un campo de texto.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2',
        'bg-accent text-white border border-accent rounded-pill shadow-card',
        'transition-colors hover:bg-accent-hover',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500, marginTop: 12 }}
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {pending ? 'Guardando...' : 'Guardar cambios'}
    </button>
  );
}

function LoadingState() {
  return (
    <output
      aria-busy="true"
      className="flex items-center gap-2 text-ink-3"
      style={{ fontSize: 14, padding: 16 }}
    >
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Cargando cuatrimestres…
    </output>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="text-st-failed-fg"
      style={{ fontSize: 14, lineHeight: 1.55, padding: 16 }}
    >
      <p style={{ marginBottom: 12 }}>No pudimos cargar los datos del catálogo. Probá de nuevo.</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'inline-flex items-center justify-center',
          'bg-bg-card text-accent-ink border border-line rounded-pill',
          'hover:bg-accent-soft transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        )}
        style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }}
      >
        Reintentar
      </button>
    </div>
  );
}
