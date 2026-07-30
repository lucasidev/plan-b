import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { TranscriptResponse } from './types';

/**
 * Server-side fetch del historial académico del alumno (GET /api/me/enrollment-records,
 * US-045-e). Usado directo por la RSC de `/my-career` (sin TanStack Query: ver el comentario
 * en la page sobre por qué alcanza con props acá).
 */
export async function fetchTranscriptServer(): Promise<TranscriptResponse> {
  const response = await apiFetchAuthenticated('/api/me/enrollment-records', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Transcript fetch failed: ${response.status}`);
  }
  return (await response.json()) as TranscriptResponse;
}
