'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { careerCatalogQueries } from '../api';

type Props = {
  /** careerPlanId elegido. Cadena vacía si todavía no hay selección. */
  value: string;
  onChange: (careerPlanId: string) => void;
};

/**
 * Picker de Universidad → Carrera → Plan de estudios. Extraído de
 * `features/onboarding/components/career-form.tsx`: con ADR-0086 la carrera se declara en el
 * registro y no en el onboarding, así que el picker vive en su propio feature y cada
 * consumidor pone alrededor lo suyo (el `<form>`, el submit, el resto de los campos).
 *
 * **Componente controlado**: el padre es dueño del `careerPlanId` final (`value` +
 * `onChange`) y decide qué hacer con él (acá siempre queda en el DOM como
 * `<select name="careerPlanId">`, así que un `<form>` nativo alrededor lo manda solo via
 * FormData). El picker solo administra el estado intermedio de la cascada (universidad,
 * carrera): nadie de afuera lo necesita.
 *
 * **Cascades**: cada query de TanStack arranca con `enabled: !!parentId` (configurado en
 * `careerCatalogQueries`). Cambiar de universidad resetea carrera y plan; cambiar de carrera
 * resetea plan. El backend devuelve listas vacías para padres inválidos en vez de error, así
 * que la UI solo necesita cubrir loading + vacío + happy.
 *
 * **A11y**: cada `<select>` tiene un `<label>` asociado por id explícito. Los dropdowns
 * dependientes quedan disabled hasta que el padre tiene valor para que el lector de pantalla
 * anuncie el estado correcto. El loading se expone via `aria-busy`.
 */
export function CareerPicker({ value, onChange }: Props) {
  const [universityId, setUniversityId] = useState<string>('');
  const [careerId, setCareerId] = useState<string>('');

  const universities = useQuery(careerCatalogQueries.universities());
  const careers = useQuery(careerCatalogQueries.careersByUniversity(universityId || null));
  const plans = useQuery(careerCatalogQueries.careerPlansByCareer(careerId || null));

  // Reset de la cascada en el handler del select (imperativo) en vez de con un useEffect:
  // el cuerpo no usa la dependencia, así que un efecto-sobre-deps acá es más difícil de leer
  // que escribir el reset al lado del setter del padre.
  const handleUniversityChange = (next: string) => {
    setUniversityId(next);
    setCareerId('');
    onChange('');
  };

  const handleCareerChange = (next: string) => {
    setCareerId(next);
    onChange('');
  };

  // Filtramos los planes a los activos. Lo decide el cliente; el backend devuelve todos
  // (decisión documentada en ListCareerPlansEndpoint). `status` llega como el enum
  // CareerPlanStatus serializado a string por EF (HasConversion<string>): `Active` o
  // `Deprecated`.
  const visiblePlans = (plans.data ?? []).filter((p) => p.status === 'Active');

  // Catálogo vacío para el padre ya elegido: distinto de "todavía no elegiste el padre" o
  // "está cargando". Sin esta rama, el select quedaba habilitado y vacío sin ningún mensaje.
  const careersEmpty = !careers.isLoading && !careers.isError && (careers.data ?? []).length === 0;
  const plansEmpty = !plans.isLoading && !plans.isError && (plans.data ?? []).length === 0;

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
    <>
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
          disabled={!universityId || careers.isLoading || careers.isError || careersEmpty}
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
                : careers.isError
                  ? 'No pudimos cargar las carreras'
                  : careersEmpty
                    ? 'Esta universidad todavía no tiene carreras cargadas'
                    : 'Elegí una carrera'}
          </option>
          {(careers.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {careers.isError && (
          <InlineRetry
            message="No pudimos cargar las carreras. Probá de nuevo en un rato."
            onRetry={() => careers.refetch()}
          />
        )}
      </Field>

      <Field id="plan" label="Plan de estudios">
        <select
          id="plan"
          name="careerPlanId"
          required
          disabled={!careerId || plans.isLoading || plans.isError || plansEmpty}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass}
          style={selectStyle}
          aria-busy={plans.isLoading}
        >
          <option value="">
            {!careerId
              ? 'Primero elegí una carrera'
              : plans.isLoading
                ? 'Cargando planes...'
                : plans.isError
                  ? 'No pudimos cargar los planes'
                  : plansEmpty
                    ? 'Esta carrera todavía no tiene planes cargados'
                    : 'Elegí un plan vigente'}
          </option>
          {visiblePlans.map((p) => (
            <option key={p.id} value={p.id}>
              Plan {p.year}
              {!p.isOfficial ? ' · No oficial' : ''}
            </option>
          ))}
        </select>
        {plans.isError && (
          <InlineRetry
            message="No pudimos cargar los planes. Probá de nuevo en un rato."
            onRetry={() => plans.refetch()}
          />
        )}
        {/* Si el plan seleccionado es no-oficial, mostramos badge visible. Mejora la
            transparencia ante alumnos que comparten un plan crowdsourced. */}
        {value && visiblePlans.find((p) => p.id === value && !p.isOfficial) && (
          <p className="text-ink-3" style={{ fontSize: 12, marginTop: 6 }}>
            Este plan fue subido por un alumno. Un admin lo va a validar pronto.
          </p>
        )}
      </Field>
    </>
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

/**
 * Igual que `ErrorState` pero pensado para vivir adentro de un `Field`, junto al `<select>`
 * que falló (Carrera / Plan), no reemplazando todo el picker: el alumno no debería perder la
 * universidad o carrera ya elegidas solo porque el siguiente nivel de la cascada falló.
 */
function InlineRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="text-st-failed-fg" style={{ fontSize: 12.5, marginTop: 6 }}>
      <p style={{ marginBottom: 8 }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'inline-flex items-center justify-center',
          'bg-bg-card text-accent-ink border border-line rounded-pill',
          'hover:bg-accent-soft transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        )}
        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500 }}
      >
        Reintentar
      </button>
    </div>
  );
}
