import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { FreeTexts } from './types';

/** Cuántos textos trae una tanda. La curaduría se lee de a ratos, no de una sentada. */
export const CURATION_PAGE_SIZE = 25;

/**
 * El campo libre para la curaduría (ADR-0084). Gateado por rol en el backend: del otro lado hay
 * texto que alguien escribió con sus palabras, y el producto le prometió que no se publica.
 */
export async function fetchFreeTextsServer(skip: number): Promise<FreeTexts> {
  const res = await apiFetchAuthenticated(
    `/api/reviews/curation/free-texts?skip=${skip}&take=${CURATION_PAGE_SIZE}`,
    { cache: 'no-store' },
  );

  // 401 y 403 son la carrera entre el guard del layout y la page, que renderizan en paralelo: no
  // son fallas, y tirar acá las convierte en un 500 en la pantalla que el guard estaba por dejar
  // atrás. El 403 lo agrega esta pantalla porque su endpoint gatea por rol, no solo por sesión: un
  // alumno que tipea la URL dispara la RSC antes de que el guard lo saque.
  if (res.status === 401 || res.status === 403) {
    return { items: [], total: 0 };
  }

  if (!res.ok) {
    throw new Error(`curation free texts failed with ${res.status}`);
  }

  return (await res.json()) as FreeTexts;
}

/** Una universidad y una carrera, como las lee el selector de la nota. */
export type CatalogOption = { id: string; name: string };

/**
 * Las universidades y las carreras de una, para elegir sobre cuál escribe la nota. Salen del
 * catálogo público: la curaduría no necesita ver nada que el catálogo no muestre.
 */
export async function fetchUniversitiesServer(): Promise<CatalogOption[]> {
  const res = await apiFetchAuthenticated('/api/academic/universities', { cache: 'no-store' });
  if (!res.ok) return [];
  const body = (await res.json()) as { items?: CatalogOption[] } | CatalogOption[];
  return Array.isArray(body) ? body : (body.items ?? []);
}

export async function fetchCareersServer(universityId: string): Promise<CatalogOption[]> {
  const res = await apiFetchAuthenticated(`/api/academic/careers?universityId=${universityId}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { items?: CatalogOption[] } | CatalogOption[];
  return Array.isArray(body) ? body : (body.items ?? []);
}
