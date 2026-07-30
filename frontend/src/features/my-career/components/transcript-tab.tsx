import { fetchTranscriptServer } from '@/features/my-career/api.server';
import { HistoryTab } from './history-tab';

/**
 * Server component de la tab "Historial" (US-045-e). Trae el historial real del alumno
 * (GET /api/me/enrollment-records) y se lo pasa a `HistoryTab` como props.
 *
 * Vive separado de `MyCareerPage`: las otras cuatro tabs (plan, correlativas, catálogo,
 * docentes) no necesitan este dato, así que el fetch solo corre cuando el alumno abre
 * esta tab puntual, no en cada visita a `/my-career`.
 */
export async function TranscriptTab() {
  const { periods } = await fetchTranscriptServer();
  return <HistoryTab periods={periods} />;
}
