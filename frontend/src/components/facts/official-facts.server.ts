import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { OfficialFact } from './types';

/**
 * Fetcher server-side de los datos oficiales de un sujeto (ADR-0090): las afirmaciones vigentes,
 * una por campo, listas para `OfficialFactRow`. Pública y sin cuenta, como el resto del catálogo.
 * La comparten la ficha de carrera (`subjectType: 'Offering'`) y la de institución
 * (`subjectType: 'Institution'`); Dónde estudiarla la va a reusar igual.
 *
 * Nunca 404: un sujeto sin relevamiento todavía devuelve lista vacía, que cada ficha explica con
 * su propio texto ("todavía no tenemos datos oficiales") en vez de mostrar un espacio en blanco.
 */
export async function fetchOfficialFactsServer(
  subjectType: 'Institution' | 'AcademicUnit' | 'Offering',
  subjectId: string,
): Promise<OfficialFact[]> {
  const response = await apiFetch(
    `/api/academic/official-facts?subjectType=${subjectType}&subjectId=${encodeURIComponent(subjectId)}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Official facts fetch failed: ${response.status}`);
  }

  const body = (await response.json()) as { facts: OfficialFact[] };
  return body.facts;
}
