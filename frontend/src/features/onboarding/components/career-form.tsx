'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { TextField } from '@/components/ui';
import { cn } from '@/lib/utils';
import { submitCareerAction } from '../actions';
import { onboardingQueries } from '../api';
import { initialOnboardingCareerState, type OnboardingCareerFormState } from '../types';

const currentYear = new Date().getFullYear();

/**
 * Onboarding step 02 (US-037-f). Form with cascading dropdowns University, Career, Plan
 * plus enrollment year. Submit triggers the server action that creates the
 * StudentProfile and redirects to `/onboarding/history`.
 *
 * **Cascades**: every TanStack query starts with `enabled: !!parentId` (configured in
 * queryOptions). When University changes, local state resets Career and Plan; when
 * Career changes, it resets Plan. The backend returns empty lists for invalid parents
 * instead of errors, so the UI only needs to handle loading + empty + happy.
 *
 * **A11y**: each `<select>` has a `<label>` associated by explicit id. Dependent
 * dropdowns stay disabled until the parent has a value so screen readers announce the
 * correct state. Loading state is exposed via `aria-busy`.
 */
export function CareerForm() {
  const [state, formAction] = useActionState<OnboardingCareerFormState, FormData>(
    submitCareerAction,
    initialOnboardingCareerState,
  );

  // State restore: when the student comes from the plan-import sub-flow (US-088), the
  // search params carry universityId + careerId + planId + enrollmentYear. We repopulate
  // the three dropdowns so the student doesn't have to choose again. `careerId` comes
  // straight from the /approve response (we don't have to resolve it from planId via a
  // lookup).
  //
  // We destructure `get` so React Compiler sees the minimal component dependency and can
  // memoise better (react-doctor/react-compiler-destructure-method rule). We bind the
  // method to the instance because URLSearchParams.get uses `this` internally (whatwg-url
  // in jsdom is strict and throws if called detached).
  // The Suspense boundary required by useSearchParams() lives in
  // `app/onboarding/career/page.tsx`; we suppress the local warning because the rule
  // does not detect boundaries declared in a different file than the hook.
  // react-doctor-disable-next-line nextjs-no-use-search-params-without-suspense, react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const getParam = searchParams.get.bind(searchParams);
  const initialUniversityId = getParam('universityId') ?? '';
  const initialCareerId = getParam('careerId') ?? '';
  const initialPlanId = getParam('planId') ?? '';
  const initialEnrollmentYear = getParam('enrollmentYear') ?? '';

  const [universityId, setUniversityId] = useState<string>(initialUniversityId);
  const [careerId, setCareerId] = useState<string>(initialCareerId);
  const [careerPlanId, setCareerPlanId] = useState<string>('');

  const universities = useQuery(onboardingQueries.universities());
  const careers = useQuery(onboardingQueries.careersByUniversity(universityId || null));
  const plans = useQuery(onboardingQueries.careerPlansByCareer(careerId || null));

  // Auto-select the just-created plan as soon as the career plans load. Fires only once
  // (guarded by careerPlanId already being set).
  //
  // The `no-derived-state` and `no-event-handler` rules would prefer this computed
  // inline or moved into the query's `onSuccess`. That does not apply here: the state
  // outlives the first match (the user can change the career and we need to reset),
  // and TanStack Query v5 no longer exposes `onSuccess` on useQuery. The suppressions
  // live in `react-doctor.config.json#ignore.overrides` so the config is traceable in
  // one place instead of scattered inline comments.
  useEffect(() => {
    if (!initialPlanId || careerPlanId) return;
    if (!plans.data || plans.data.length === 0) return;
    const match = plans.data.find((p) => p.id === initialPlanId);
    if (match) setCareerPlanId(match.id);
  }, [initialPlanId, careerPlanId, plans.data]);

  // Reset the cascade in the select handler (imperative) instead of with a useEffect.
  // Reason: an effect-on-deps that only fires setter reads is what biome flags as
  // "more dependencies than necessary": the body does not use the deps. It is also
  // clearer to write the reset right next to the parent setter.
  const handleUniversityChange = (next: string) => {
    setUniversityId(next);
    setCareerId('');
    setCareerPlanId('');
  };

  const handleCareerChange = (next: string) => {
    setCareerId(next);
    setCareerPlanId('');
  };

  // Filter the plans down to the active ones. The client decides; the backend returns
  // all of them (decision documented in ListCareerPlansEndpoint). `status` comes as the
  // CareerPlanStatus enum serialised to string by EF (HasConversion<string>): values
  // `Active` (current) or `Deprecated`.
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
    // <output> has implicit role="status"; idiomatic replacement for <div role="status">.
    return (
      <output className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, padding: 16 }}>
        Todavía no hay universidades disponibles en plan-b. Avisanos a soporte.
      </output>
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
              {!p.isOfficial ? ' · No oficial' : ''}
            </option>
          ))}
        </select>
        {/* Si el plan seleccionado es no-oficial, mostramos badge visible. Mejora la
            transparencia ante alumnos que comparten un plan crowdsourced. */}
        {careerPlanId && visiblePlans.find((p) => p.id === careerPlanId && !p.isOfficial) && (
          <p className="text-ink-3" style={{ fontSize: 12, marginTop: 6 }}>
            Este plan fue subido por un alumno. Un admin lo va a validar pronto.
          </p>
        )}
        {/* Link "Mi plan no aparece" visible una vez que el alumno tiene universidad
            seleccionada. Si tiene careerId también, mejor; pero queremos que pueda
            subir incluso si su Career no está en la cascada. */}
        {universityId && (
          <p style={{ fontSize: 12.5, marginTop: 8 }}>
            <Link
              href={`/onboarding/career/plan-import?universityId=${encodeURIComponent(universityId)}&enrollmentYear=${currentYear}`}
              className="text-accent-ink hover:text-accent-hover"
            >
              Mi plan no aparece, lo subo →
            </Link>
          </p>
        )}
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
          defaultValue={initialEnrollmentYear || undefined}
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
  // <output> has implicit role="status"; idiomatic way to announce loading state.
  return (
    <output
      aria-busy="true"
      className="flex items-center gap-2 text-ink-3"
      style={{ fontSize: 14, padding: 16 }}
    >
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Cargando universidades…
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
