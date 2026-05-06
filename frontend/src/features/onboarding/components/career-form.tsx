'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { TextField } from '@/components/ui';
import { cn } from '@/lib/utils';
import { submitCareerAction } from '../actions';
import { onboardingQueries } from '../api';
import { initialOnboardingCareerState, type OnboardingCareerFormState } from '../types';

const currentYear = new Date().getFullYear();

/**
 * Paso 02 del onboarding (US-037-f). Form con cascadas University → Career →
 * Plan + año de ingreso. Submit dispara el server action que crea el
 * StudentProfile y redirige a `/onboarding/history`.
 *
 * **Cascadas**: cada query de TanStack arranca con `enabled: !!parentId`
 * (configurado en queryOptions). Cuando cambia la University, el state local
 * resetea Career y Plan; cuando cambia Career, resetea Plan. El backend
 * devuelve listas vacías para parents inválidos, no errores — así que la UI
 * solo necesita manejar loading + empty + happy.
 *
 * **A11y**: cada `<select>` tiene `<label>` asociado por id explícito. Los
 * dropdowns dependientes están deshabilitados hasta que el parent tenga
 * valor, para que screen readers anuncien estado correcto. El estado de
 * loading se anuncia con `aria-busy`.
 */
export function CareerForm() {
  const [state, formAction] = useActionState<OnboardingCareerFormState, FormData>(
    submitCareerAction,
    initialOnboardingCareerState,
  );

  const [universityId, setUniversityId] = useState<string>('');
  const [careerId, setCareerId] = useState<string>('');
  const [careerPlanId, setCareerPlanId] = useState<string>('');

  const universities = useQuery(onboardingQueries.universities());
  const careers = useQuery(onboardingQueries.careersByUniversity(universityId || null));
  const plans = useQuery(onboardingQueries.careerPlansByCareer(careerId || null));

  // Reset cascadas en el handler del select (imperativo) en lugar de useEffect.
  // Razón: el effect-on-deps que solo dispara setters reads is what biome marca
  // como "more dependencies than necessary" — el body no usa las deps. Más
  // claro escribir el reset al lado del setter del parent.
  const handleUniversityChange = (next: string) => {
    setUniversityId(next);
    setCareerId('');
    setCareerPlanId('');
  };

  const handleCareerChange = (next: string) => {
    setCareerId(next);
    setCareerPlanId('');
  };

  // Filtrar planes para mostrar solo los vigentes. El cliente decide, el
  // backend devuelve todos (decisión documentada en ListCareerPlansEndpoint).
  // El status viene como el enum CareerPlanStatus serializado a string por EF
  // (HasConversion<string>): valores `Active` (vigente) o `Deprecated`.
  const visiblePlans = (plans.data ?? []).filter((p) => p.status === 'Active');

  const formError = state.status === 'error' ? state.message : null;
  const fieldError = state.status === 'error' ? state.field : undefined;

  if (universities.isError) {
    return <ErrorState onRetry={() => universities.refetch()} />;
  }

  if (universities.isLoading) {
    return <LoadingState />;
  }

  if ((universities.data ?? []).length === 0) {
    return (
      <div
        role="status"
        className="text-ink-2"
        style={{ fontSize: 14, lineHeight: 1.55, padding: 16 }}
      >
        Todavía no hay universidades disponibles en plan-b. Avisanos a soporte.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <Field id="university" label="Universidad">
        <select
          id="university"
          name="universityId"
          required
          value={universityId}
          onChange={(e) => handleUniversityChange(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="">Elegí una universidad</option>
          {(universities.data ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="career" label="Carrera">
        <select
          id="career"
          name="careerId"
          required
          disabled={!universityId || careers.isLoading}
          value={careerId}
          onChange={(e) => handleCareerChange(e.target.value)}
          className={selectClass}
          style={selectStyle}
          aria-busy={careers.isLoading}
        >
          <option value="">
            {!universityId
              ? 'Primero elegí una universidad'
              : careers.isLoading
                ? 'Cargando carreras...'
                : 'Elegí una carrera'}
          </option>
          {(careers.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="plan" label="Plan de estudios">
        <select
          id="plan"
          name="careerPlanId"
          required
          disabled={!careerId || plans.isLoading}
          value={careerPlanId}
          onChange={(e) => setCareerPlanId(e.target.value)}
          className={selectClass}
          style={selectStyle}
          aria-busy={plans.isLoading}
        >
          <option value="">
            {!careerId
              ? 'Primero elegí una carrera'
              : plans.isLoading
                ? 'Cargando planes...'
                : 'Elegí un plan vigente'}
          </option>
          {visiblePlans.map((p) => (
            <option key={p.id} value={p.id}>
              Plan {p.year}
            </option>
          ))}
        </select>
      </Field>

      <div style={{ marginBottom: 16 }}>
        <TextField
          name="enrollmentYear"
          type="number"
          inputMode="numeric"
          required
          min={1990}
          max={currentYear + 1}
          placeholder={String(currentYear)}
          error={fieldError === 'enrollmentYear' ? (formError ?? undefined) : undefined}
          autoComplete="off"
          label="Año de ingreso"
        />
      </div>

      {formError && fieldError !== 'enrollmentYear' && (
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
      {label && (
        <label
          htmlFor={id}
          className="text-ink-2"
          style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
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
      {pending ? 'Guardando...' : 'Continuar'}
    </button>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex items-center gap-2 text-ink-3"
      style={{ fontSize: 14, padding: 16 }}
    >
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Cargando universidades...
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="text-st-failed-fg"
      style={{ fontSize: 14, lineHeight: 1.55, padding: 16 }}
    >
      <p style={{ marginBottom: 12 }}>
        No pudimos cargar las universidades. Probá de nuevo en un rato.
      </p>
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
