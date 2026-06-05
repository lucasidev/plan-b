'use client';

import { FileUp, Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { uploadCareerPlanAction } from '../actions';
import { initialUploadCareerPlanState, type UploadCareerPlanState } from '../types';

type Props = {
  universityId: string;
  universityName: string;
  defaultEnrollmentYear: number;
  onUploaded: (importId: string) => void;
};

/**
 * Career-plan upload form. Receives the university already chosen in onboarding step 2
 * (hidden). The student types the career name + plan year + enrollment year and uploads
 * a PDF or pastes text.
 */
export function UploadCareerPlanForm({
  universityId,
  universityName,
  defaultEnrollmentYear,
  onUploaded,
}: Props) {
  const [state, formAction] = useActionState<UploadCareerPlanState, FormData>(
    handleUploadAction(onUploaded),
    initialUploadCareerPlanState,
  );
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');

  const error = state.status === 'error' ? state.message : null;
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <input type="hidden" name="universityId" value={universityId} />

      <div
        className="text-ink-3 border border-line rounded bg-bg-card"
        style={{ padding: 12, marginBottom: 16, fontSize: 12.5 }}
      >
        Subiendo plan para <strong className="text-ink">{universityName}</strong>.
      </div>

      <Field id="careerName" label="Nombre de tu carrera">
        {/* Explicit aria-label: the rule does not detect the <label htmlFor> rendered
            by the <Field> wrapper from a different component. */}
        <input
          id="careerName"
          name="careerName"
          type="text"
          required
          maxLength={200}
          placeholder="Ej.: Tecnicatura en Desarrollo y Calidad de Software"
          className={inputClass}
          style={inputStyle}
          aria-label="Nombre de tu carrera"
        />
      </Field>

      <div className="grid grid-cols-2" style={{ gap: 12, marginBottom: 16 }}>
        <Field id="planYear" label="Año del plan">
          <input
            id="planYear"
            name="planYear"
            type="number"
            required
            min={1990}
            max={currentYear}
            defaultValue={currentYear}
            className={inputClass}
            style={inputStyle}
            aria-label="Año del plan"
          />
        </Field>
        <Field id="studentEnrollmentYear" label="Año de ingreso">
          <input
            id="studentEnrollmentYear"
            name="studentEnrollmentYear"
            type="number"
            required
            min={1990}
            max={currentYear + 1}
            defaultValue={defaultEnrollmentYear}
            className={inputClass}
            style={inputStyle}
            aria-label="Año de ingreso"
          />
        </Field>
      </div>

      <div
        className="flex items-center gap-2 border-b border-line"
        style={{ marginBottom: 16, paddingBottom: 8 }}
      >
        <ModeButton active={mode === 'pdf'} onClick={() => setMode('pdf')}>
          Subir PDF
        </ModeButton>
        <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
          Pegar texto
        </ModeButton>
      </div>

      {mode === 'pdf' && (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="file"
            className="text-ink-2"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            Archivo PDF del plan
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required={mode === 'pdf'}
            className="text-ink"
            style={{ fontSize: 13 }}
            aria-label="Archivo PDF del plan"
          />
          <p className="text-ink-3" style={{ fontSize: 12, marginTop: 6 }}>
            Hasta 5 MB. Bajá el PDF del plan desde la página oficial de tu universidad.
          </p>
        </div>
      )}

      {mode === 'text' && (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="rawText"
            className="text-ink-2"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
          >
            Pegá el texto del plan
          </label>
          <textarea
            id="rawText"
            name="rawText"
            rows={12}
            required={mode === 'text'}
            placeholder="Ej.:&#10;1° AÑO - 1° CUATRIMESTRE&#10;MAT101 Análisis Matemático I&#10;ALG101 Álgebra I&#10;…"
            className={cn(
              'w-full bg-bg-card text-ink border border-line rounded',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: 12, fontSize: 13, fontFamily: 'inherit', lineHeight: 1.55 }}
            aria-label="Texto del plan"
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function handleUploadAction(
  onUploaded: (importId: string) => void,
): (prev: UploadCareerPlanState, formData: FormData) => Promise<UploadCareerPlanState> {
  return async (prev, formData) => {
    const next = await uploadCareerPlanAction(prev, formData);
    if (next.status === 'success') {
      queueMicrotask(() => onUploaded(next.importId));
    }
    return next;
  };
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

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-pill border transition-colors',
        active
          ? 'bg-accent-soft border-accent text-accent-ink'
          : 'bg-bg-card border-line text-ink-3 hover:text-ink-2',
      )}
      style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

const inputClass = cn(
  'w-full bg-bg-card text-ink border border-line rounded',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
);

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
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
      {pending ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <FileUp size={16} aria-hidden />
      )}
      {pending ? 'Subiendo...' : 'Procesar'}
    </button>
  );
}
