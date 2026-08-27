import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { ChairOption, CurrentInstrument, SubjectOption, TermOption } from './types';

/**
 * Fetchers server-side de la pantalla Reseñar (US-146). Los cuatro son de lectura y tres son
 * públicos: ver qué se pregunta y contra qué materias es parte de saber en qué te estás metiendo.
 * La cuenta la pide responder, no mirar.
 */

/** El cuestionario vigente con sus ítems y opciones en orden (ADR-0082). */
export async function fetchCurrentInstrumentServer(): Promise<CurrentInstrument | null> {
  const response = await apiFetch('/api/reviews/instrument', { cache: 'no-store' });
  if (response.status === 404) {
    // Todavía no se publicó ningún cuestionario: la pantalla lo dice en vez de romper.
    return null;
  }
  if (!response.ok) {
    throw new Error(`Instrument fetch failed: ${response.status}`);
  }
  return (await response.json()) as CurrentInstrument;
}

/** Las materias del plan del alumno: es contra lo que elige qué cursada contar. */
export async function fetchPlanSubjectsServer(careerPlanId: string): Promise<SubjectOption[]> {
  const response = await apiFetch(
    `/api/academic/subjects?careerPlanId=${encodeURIComponent(careerPlanId)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Plan subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as SubjectOption[];
}

/** Los períodos lectivos de su universidad, para decir cuándo la cursó. */
export async function fetchTermsServer(universityId: string): Promise<TermOption[]> {
  const response = await apiFetch(
    `/api/academic/academic-terms?universityId=${encodeURIComponent(universityId)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Academic terms fetch failed: ${response.status}`);
  }
  return (await response.json()) as TermOption[];
}

/**
 * Las cátedras de una materia, con su titular vigente. Público como el resto del catálogo: la
 * ficha de una cátedra se lee sin cuenta, así que su lista también.
 */
export async function fetchChairsServer(subjectId: string): Promise<ChairOption[]> {
  const response = await apiFetch(`/api/academic/subjects/${subjectId}/chairs`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Chairs fetch failed: ${response.status}`);
  }
  return (await response.json()) as ChairOption[];
}
