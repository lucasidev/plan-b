import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type {
  AcademicTerm,
  AvailableSubjectsResponse,
  ListSimulationDraftsResponse,
} from './types';

/**
 * Materias del plan evaluadas por el planificador (US-016), con la oferta de comisiones de un
 * período puntual (US-096, `termId` opcional). GET /api/me/simulator/available, autenticado
 * (alumno con StudentProfile activo). Usado por la RSC de /plan para prefetchear + hidratar el
 * drawer "Agregar materia" (`components/subject-picker-drawer.tsx`) y el picker de comisión, así
 * consumen con useSuspenseQuery sin un roundtrip extra al abrirse.
 */
export async function fetchAvailableSubjectsServer(
  termId: string | null = null,
): Promise<AvailableSubjectsResponse> {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : '';
  const res = await apiFetchAuthenticated(`/api/me/simulator/available${query}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`available subjects fetch failed with ${res.status}`);
  }
  return (await res.json()) as AvailableSubjectsResponse;
}

/**
 * Períodos lectivos de una universidad (US-096). GET /api/academic/academic-terms?universityId=,
 * público (`AllowAnonymous`, ver `ListAcademicTermsEndpoint`): se lee igual con el fetcher
 * server-only por consistencia con el resto de los fetchers de este feature, aunque no necesite la
 * cookie de sesión. Usado por la RSC de /plan para resolver el selector de período del header.
 */
export async function fetchAcademicTermsServer(universityId: string): Promise<AcademicTerm[]> {
  const res = await apiFetchAuthenticated(
    `/api/academic/academic-terms?universityId=${encodeURIComponent(universityId)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error(`academic terms fetch failed with ${res.status}`);
  }
  return (await res.json()) as AcademicTerm[];
}

/**
 * Borradores guardados del alumno (US-023), todos los estados. GET /api/me/simulations/drafts,
 * autenticado (alumno con StudentProfile activo). Usado por la RSC de /plan para prefetchear +
 * hidratar antes de que `PlanShell` los consuma con useSuspenseQuery (tabs "En curso"/"Borradores").
 */
export async function fetchSimulationDraftsServer(): Promise<ListSimulationDraftsResponse> {
  const res = await apiFetchAuthenticated('/api/me/simulations/drafts', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`simulation drafts fetch failed with ${res.status}`);
  }
  return (await res.json()) as ListSimulationDraftsResponse;
}
