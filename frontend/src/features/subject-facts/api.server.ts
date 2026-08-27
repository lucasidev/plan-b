import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { SubjectFacts } from './types';

/**
 * Fetcher server-side de la ficha de materia (US-129). Público y sin cuenta, como toda la
 * superficie que el producto publica.
 *
 * Devuelve null cuando la materia no existe, para que la ruta responda 404 en vez de reventar.
 */
export async function fetchSubjectFactsServer(subjectId: string): Promise<SubjectFacts | null> {
  const response = await apiFetch(`/api/reviews/subjects/${encodeURIComponent(subjectId)}/facts`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Subject facts fetch failed: ${response.status}`);
  }

  return (await response.json()) as SubjectFacts;
}
