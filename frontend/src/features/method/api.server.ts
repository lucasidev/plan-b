import 'server-only';

import type { CurrentInstrument } from '@/components/instrument/types';
import { fetchCurrentInstrumentServer } from '@/features/write-course-review/api.server';
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

/**
 * Devuelve `null` en vez de tirar. Los pisos gobiernan un solo bloque de Método; el resto de la
 * pantalla (de dónde sale una voz, por qué nada se promedia, los sesgos, el cuestionario entero)
 * no depende de ningún número y sigue siendo auditable sin ellos. Tirar acá tumbaba la pantalla
 * pública entera por la dependencia con menos razones para fallar.
 *
 * Lo que no se hace es inventar un piso por defecto: un número escrito a mano que no salió de la
 * regla es peor que no mostrarlo, porque suena a método.
 */
export async function fetchPublishingRulesServer(): Promise<PublishingRules | null> {
  try {
    const response = await apiFetch('/api/reviews/publishing-rules', { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublishingRules;
  } catch {
    return null;
  }
}

/**
 * El cuestionario para Método. El fetcher compartido tira si el endpoint no responde, y ahí eso es
 * correcto: la pantalla de reseñar sin cuestionario no tiene formulario que mostrar. Método sí
 * tiene qué mostrar sin él, así que degrada acá y no en el contrato que comparte.
 */
export async function fetchInstrumentForMethodServer(): Promise<CurrentInstrument | null> {
  try {
    return await fetchCurrentInstrumentServer();
  } catch {
    return null;
  }
}
