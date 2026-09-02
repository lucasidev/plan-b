import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { CatalogItem } from './types';

/**
 * El catálogo de frases (US-198). Gateado por rol en el backend: es el único lugar donde se edita lo
 * que el producto pregunta, y una frase mal definida es un error en todas las fichas que la usan.
 *
 * Sin paginar: son decenas de filas y curar es mirar el conjunto, no una página de él.
 */
export async function fetchItemsServer(): Promise<CatalogItem[]> {
  const res = await apiFetchAuthenticated('/api/reviews/curation/items', { cache: 'no-store' });

  // 401 y 403 son la carrera entre el guard del layout y la page, que renderizan en paralelo: no
  // son fallas, y tirar acá las convierte en un 500 en la pantalla que el guard estaba por dejar
  // atrás. Mismo criterio que el resto de la curaduría.
  if (res.status === 401 || res.status === 403) return [];

  if (!res.ok) {
    throw new Error(`item catalog failed with ${res.status}`);
  }

  const body = (await res.json()) as { items: CatalogItem[] };
  return body.items;
}
