import { sanitizeInternalRedirect } from '@/lib/internal-redirect';

/** A qué acción manda cada destino que dispara el gate, para decirlo arriba del form (US-229). */
const GATE_REASONS: Record<string, string> = {
  '/reviews/new': 'Para reseñar una cursada, necesitás una cuenta.',
};

export type SignInGate = {
  /** Ruta interna sana a la que volver tras entrar, o null si no vino de ninguna acción. */
  from: string | null;
  /** El motivo a mostrar arriba del form, o null si `from` no es una acción reconocida. */
  reason: string | null;
};

/**
 * Separa, del `from` que llega por query string, la ruta sana a la que volver del motivo que la
 * pantalla muestra. Nunca confía en el valor crudo (ver sanitizeInternalRedirect): un destino
 * externo o inválido entra igual que si no hubiera venido de ninguna acción (US-229, E3).
 */
export function resolveSignInGate(rawFrom: string | null | undefined): SignInGate {
  const from = sanitizeInternalRedirect(rawFrom);
  return { from, reason: from ? (GATE_REASONS[from] ?? null) : null };
}
