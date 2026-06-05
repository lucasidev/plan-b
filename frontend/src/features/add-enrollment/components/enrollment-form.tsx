'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { submitAddEnrollmentAction } from '../actions';
import { addEnrollmentQueries } from '../api';
import { type AddEnrollmentFormState, initialAddEnrollmentState } from '../types';

type Props = {
  careerPlanId: string;
  universityId: string;
};

/**
 * Form to load a transcript entry (US-013-f). Replaces the stub of
 * `(member)/my-career/transcript/add/page.tsx`.
 *
 * Loads: subjects (filtered by the student's `careerPlanId`) and academic terms
 * (filtered by `universityId`). Both come from the public Academic catalog endpoints
 * shipped in PR1.
 *
 * Conditional rendering of the form:
 *   - Status=Aprobada: shows the `approvalMethod` select + `grade` input. If
 *     method=Equivalencia, hides term + commission. If method=FinalLibre, hides
 *     commission.
 *   - Status=Regular: shows the `grade` input, hides `approvalMethod`.
 *   - Status in {Cursando, Reprobada, Abandonada}: hides grade + approvalMethod.
 *
 * The backend re-validates every invariant: this form only guides the user.
 */
export function EnrollmentForm({ careerPlanId, universityId }: Props) {
  const [state, formAction] = useActionState<AddEnrollmentFormState, FormData>(
    submitAddEnrollmentAction,
    initialAddEnrollmentState,
  );

  const [status, setStatus] = useState<string>('Aprobada');
  const [approvalMethod, setApprovalMethod] = useState<string>('FinalLibre');

  const subjects = useQuery(addEnrollmentQueries.subjects(careerPlanId));
  const terms = useQuery(addEnrollmentQueries.academicTerms(universityId));

  const showApprovalMethod = status === 'Aprobada';
  const showGrade = status === 'Aprobada' || status === 'Regular';
  // commission/term are optional depending on the method (when applicable). For MVP
  // simplicity we don't expose a commission picker (no commissions endpoint yet); the
  // student only picks the term, commissionId stays null in this form.
  const showTerm = !showApprovalMethod || approvalMethod !== 'Equivalencia';

  const formError = state.status === 'error' ? state.message : null;
  const fieldError = state.status === 'error' ? state.field : undefined;

  if (subjects.isError || terms.isError) {
    return (
      <ErrorState
        onRetry={() => {
          subjects.refetch();
          terms.refetch();
        }}
      />
    );
  }

  if (subjects.isLoading || terms.isLoading) {
    return <LoadingState />;
  }

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <Field id="subject" label="Materia">
        <select
          id="subject"
          name="subjectId"
          required
          className={selectClass}
          style={selectStyle}
          defaultValue=""
        >
          <option value="">Elegí una materia</option>
          {(subjects.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name} ({s.yearInPlan}º año
              {s.termInYear ? `, ${s.termInYear}c` : ''})
            </option>
          ))}
        </select>
        {fieldError === 'subjectId' && <FieldError>{formError}</FieldError>}
      </Field>

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
          <option value="Aprobada">Aprobada</option>
          <option value="Regular">Regular (regularicé, falta final)</option>
          <option value="Cursando">Cursando</option>
          <option value="Reprobada">Reprobada</option>
          <option value="Abandonada">Abandonada</option>
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
            <option value="Cursada">Cursada (regular + final)</option>
            <option value="Promocion">Promoción</option>
            <option value="Final">Final</option>
            <option value="FinalLibre">Final libre</option>
            <option value="Equivalencia">Equivalencia</option>
          </select>
          {fieldError === 'approvalMethod' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {showTerm && (
        <Field id="term" label="Cuatrimestre">
          <select
            id="term"
            name="termId"
            required={status === 'Cursando' || approvalMethod === 'FinalLibre'}
            className={selectClass}
            style={selectStyle}
            defaultValue=""
          >
            <option value="">
              {showApprovalMethod && approvalMethod === 'FinalLibre'
                ? 'Elegí el cuatrimestre en que rendiste'
                : 'Elegí un cuatrimestre'}
            </option>
            {(terms.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {fieldError === 'termId' && <FieldError>{formError}</FieldError>}
        </Field>
      )}

      {showGrade && (
        <Field id="grade" label="Nota final (0 a 10)">
          {/* Explicit aria-label: react-doctor does not detect the <label htmlFor>
              rendered by the <Field> wrapper from a different component. */}
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
      {pending ? 'Guardando...' : 'Cargar entrada'}
    </button>
  );
}

function LoadingState() {
  // <output> has implicit role="status" and is a semantic HTML element; replaces
  // <div role="status"> with the idiomatic version.
  return (
    <output
      aria-busy="true"
      className="flex items-center gap-2 text-ink-3"
      style={{ fontSize: 14, padding: 16 }}
    >
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Cargando materias y cuatrimestres…
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
