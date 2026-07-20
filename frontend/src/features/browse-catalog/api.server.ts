import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { Career, CareerPlan, CareerPlanSummary, Subject, University } from './types';

/**
 * Server fetchers para el catálogo público (US-001): universidades → carreras → planes →
 * materias. Los endpoints son públicos (AllowAnonymous); usamos `apiFetchAuthenticated` porque
 * reenvía la cookie de sesión cuando existe pero funciona igual sin ella, mismo patrón que
 * `features/view-subject/api.server.ts`.
 */

/** Listado completo de universidades del catálogo (MVP: pocas unis, sin paginación). */
export async function fetchUniversitiesServer(): Promise<University[]> {
  const response = await apiFetchAuthenticated('/api/academic/universities', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Universities fetch failed: ${response.status}`);
  }
  return (await response.json()) as University[];
}

/** Carreras de una universidad. Lista vacía (no 404) si la uni no tiene carreras cargadas. */
export async function fetchCareersByUniversityServer(universityId: string): Promise<Career[]> {
  const response = await apiFetchAuthenticated(
    `/api/academic/careers?universityId=${universityId}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Careers fetch failed: ${response.status}`);
  }
  return (await response.json()) as Career[];
}

/** Planes (vigentes + históricos) de una carrera. Lista vacía (no 404) si no hay planes. */
export async function fetchPlansByCareerServer(careerId: string): Promise<CareerPlan[]> {
  const response = await apiFetchAuthenticated(`/api/academic/career-plans?careerId=${careerId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Career plans fetch failed: ${response.status}`);
  }
  return (await response.json()) as CareerPlan[];
}

/** Resuelve un CareerPlan puntual (careerId + universityId + year). `null` en 404. */
export async function fetchPlanServer(id: string): Promise<CareerPlanSummary | null> {
  const response = await apiFetchAuthenticated(`/api/academic/career-plans/${id}`, {
    cache: 'no-store',
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Career plan fetch failed: ${response.status}`);
  }
  return (await response.json()) as CareerPlanSummary;
}

/** Materias de un plan, sin agrupar (la UI agrupa por año/término, ver `components/subject-grid`). */
export async function fetchSubjectsByPlanServer(careerPlanId: string): Promise<Subject[]> {
  const response = await apiFetchAuthenticated(
    `/api/academic/subjects?careerPlanId=${careerPlanId}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as Subject[];
}
