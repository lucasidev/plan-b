import 'server-only';

import { apiFetch } from '@/lib/api-client';

/**
 * Los pisos que gobiernan qué se publica (US-130). Se leen del backend y no se escriben acá: un
 * número de producto escrito en la pantalla sería una segunda definición de la regla, y al cambiar
 * la constante Método seguiría explicando la anterior.
 */
export type PublishingRules = {
  chairMinimumReviews: number;
  subjectPairMinimumReviews: number;
};

export async function fetchPublishingRulesServer(): Promise<PublishingRules> {
  const response = await apiFetch('/api/reviews/publishing-rules', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Publishing rules fetch failed: ${response.status}`);
  }
  return (await response.json()) as PublishingRules;
}
