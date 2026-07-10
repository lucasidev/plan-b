/**
 * Tipos del backoffice de moderación (US-050 cola + US-051 detalle). Espejan 1:1 el contrato real de
 * los endpoints del módulo moderation (camelCase del serializer de ASP.NET), no el doc aspiracional:
 * los ids son guids (no `rep_1108`), no hay `since` precomputado (se calcula en el cliente con
 * formatRelativeDate), y el detalle trae la prosa de la reseña en subjectText/teacherText.
 */

export type ReportTone = 'urgent' | 'normal' | 'low';

/** Counts globales para los filter chips + el subtitle. GET .../reports/queue → `counts`. */
export type ReportQueueCounts = {
  openCount: number;
  closedLast7d: number;
  urgentCount: number;
  normalCount: number;
  lowCount: number;
  staleCount: number;
};

/** Una fila de la cola: un report individual (no agrupado por reseña). */
export type ReportQueueItem = {
  id: string;
  createdAt: string;
  reason: string;
  snippet: string | null;
  targetReviewId: string;
  reporterUserId: string;
  tone: ReportTone;
};

/** Response completo de la cola: counts + página de items + paginación. */
export type ReportQueueData = {
  counts: ReportQueueCounts;
  items: ReportQueueItem[];
  page: number;
  pageSize: number;
  totalCount: number;
};

/** Filtros que la página traduce a query params del endpoint. */
export type ReportQueueFilters = {
  status: 'open' | 'closed';
  tone: ReportTone | null;
};

/** Un report open de la misma reseña, distinto del actual (preview del cascade en el detalle). */
export type OtherOpenReport = {
  id: string;
  reason: string;
  createdAt: string;
};

/** Detalle completo del report para la pantalla de decisión (US-051). GET .../reports/{id}. */
export type ReportDetail = {
  // Report
  reportId: string;
  reason: string;
  tone: ReportTone;
  details: string | null;
  reportCreatedAt: string;
  status: string;
  resolutionNote: string | null;
  resolvedAt: string | null;
  moderatorUserId: string | null;
  // Reseña reportada
  reviewId: string;
  subjectText: string | null;
  teacherText: string | null;
  difficultyRating: number | null;
  overallRating: number | null;
  reviewStatus: string | null;
  // Reporter
  reporterUserId: string;
  reporterDisabled: boolean;
  // Contexto del autor de la reseña
  authorUserId: string | null;
  authorAccountSince: string | null;
  authorReviewsWritten: number;
  authorReportsReceived: number;
  authorBanned: boolean;
  // Cascade preview
  otherOpenReports: OtherOpenReport[];
};

/** La decisión live del panel: aprobar (dismiss) u ocultar la reseña (uphold). */
export type ReportDecision = 'dismiss' | 'uphold';

/**
 * Resultado de aplicar una decisión. `conflict` marca el 409 (otro moderador ganó la race): el cliente
 * lo distingue para mostrar el toast "ya resuelto" y volver a la cola.
 */
export type ResolveResult =
  | { ok: true; cascadedCount: number }
  | { ok: false; message: string; conflict?: boolean };
