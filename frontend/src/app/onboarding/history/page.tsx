import { HistoryOptions } from '@/features/onboarding';

/**
 * `/onboarding/history` — paso 03 (US-037-f). Tres opciones para cargar
 * historial: PDF (US-014), manual (US-013), "lo cargo después".
 *
 * No hay guard de profile acá: el flow normal es venir desde paso 02 (que
 * ya creó el profile). Si un user pega URL directa sin profile previo,
 * vería las opciones de history sin contexto, pero el path "lo cargo
 * después" es no destructivo y avanza a /onboarding/done que muestra
 * confirmación. Ningún edge case rompe.
 *
 * Server component completo: el componente no tiene state.
 */
export default function OnboardingHistoryPage() {
  return <HistoryOptions />;
}
