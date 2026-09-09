import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { CareerComparison } from './types';

/**
 * Fetcher server-side de Dónde estudiarla (SC-008, US-128, ADR-0090, R6 tarea 5). Pública y sin
 * cuenta, como el resto del catálogo.
 *
 * Devuelve null cuando la carrera no existe, para que la ruta responda 404 en vez de reventar.
 */
export async function fetchCareerComparisonServer(
  careerId: string,
): Promise<CareerComparison | null> {
  const response = await apiFetch(
    `/api/academic/career-comparison?careerId=${encodeURIComponent(careerId)}`,
    { cache: 'no-store' },
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Career comparison fetch failed: ${response.status}`);
  }

  return (await response.json()) as CareerComparison;
}
