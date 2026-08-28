import 'server-only';

import type { ChairFacts } from '@/features/chair-facts';
import { apiFetch } from '@/lib/api-client';

/**
 * La ficha que la entrada muestra como muestra (US-221): una cátedra al azar entre las que ya
 * publican. Es la misma ficha que sirve `/chairs/{id}`, no un resumen armado para la landing: que
 * la entrada muestre exactamente lo que muestra la pantalla a la que lleva es el punto de la story.
 *
 * Devuelve null cuando todavía ninguna cátedra cruzó el piso. La entrada lo trata como un estado
 * y no como un error: dice que todavía no hay nada publicado, en vez de inventar un ejemplo.
 */
export async function fetchSampleChairFactsServer(): Promise<ChairFacts | null> {
  const response = await apiFetch('/api/reviews/chairs/sample', { cache: 'no-store' });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Sample chair facts fetch failed: ${response.status}`);
  }

  return (await response.json()) as ChairFacts;
}
