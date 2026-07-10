import type { ReportTone } from './types';

/**
 * Copy human-readable de los motivos de reporte, en la voz del moderador (distinta de la del reporter
 * en `report-review`: allá es "Lenguaje ofensivo", acá el staff ve "Insulto o lenguaje ofensivo"). Las
 * claves son los 5 valores reales del enum ReviewReportReason del backend. Motivos diferentes para
 * audiencias diferentes: no es la misma abstracción que la del modal de denuncia (mindset #5).
 */
const REASON_LABELS: Record<string, string> = {
  OffTopic: 'No es sobre la cursada',
  DatosPersonales: 'Datos personales',
  LenguajeInapropiado: 'Insulto o lenguaje ofensivo',
  Difamacion: 'Información falsa',
  Spam: 'Spam o promoción',
};

/** Label del motivo; si el enum crece y llega uno desconocido, se muestra el valor crudo. */
export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

/** Copy del estado de la reseña reportada (enum ReviewStatus del backend). */
const REVIEW_STATUS_LABELS: Record<string, string> = {
  Published: 'pública',
  UnderReview: 'en revisión',
  Removed: 'oculta',
  Deleted: 'borrada',
};

export function reviewStatusLabel(status: string | null): string {
  if (!status) return 'desconocido';
  return REVIEW_STATUS_LABELS[status] ?? status.toLowerCase();
}

/**
 * Presentación de cada tono. El color del dot lo fija el canvas (US-050): urgente teja, normal ámbar,
 * bajo gris (token `--ink-4`). Se aplican como estilo inline porque son valores del design source, no
 * utilidades del sistema.
 */
export const TONE_PRESENTATION: Record<
  ReportTone,
  { dotColor: string; label: string; chipLabel: string; emoji: string }
> = {
  urgent: { dotColor: '#b04a1c', label: 'urgente', chipLabel: 'Urgentes', emoji: '🔴' },
  normal: { dotColor: '#945a14', label: 'normal', chipLabel: 'Normales', emoji: '🟡' },
  low: { dotColor: 'var(--ink-4)', label: 'bajo', chipLabel: 'Bajos', emoji: '⚪' },
};
