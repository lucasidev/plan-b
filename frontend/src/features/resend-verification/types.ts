/**
 * Types para el feature resend-verification (US-021). El state vive aca porque
 * actions.ts es `'use server'` y Next.js solo permite exports async desde esos
 * archivos.
 *
 * El status `sent` discrimina el caso happy: el componente del botón muestra un
 * mensaje "Listo, revisá tu casilla" sin redirigir. `rate_limit` muestra el
 * cooldown explícito ("esperá unos minutos"). `validation` se renderiza cerca
 * del input. `unknown` es fallback para 5xx u otros errores no esperados.
 */
export type ResendVerificationFormState =
  | { status: 'idle' }
  | { status: 'sent' }
  | {
      status: 'error';
      kind: 'validation' | 'rate_limit' | 'unknown';
      message: string;
    };

export const initialResendVerificationState: ResendVerificationFormState = { status: 'idle' };
