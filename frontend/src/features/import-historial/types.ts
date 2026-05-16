/**
 * DTOs del backend US-014 (POST/GET/POST confirm de /api/me/historial-imports).
 * Reflejan exactamente el shape que serializa el backend (camelCase via JsonOptions).
 */

export type HistorialImportStatus = 'Pending' | 'Parsing' | 'Parsed' | 'Failed' | 'Confirmed';

export type ParseConfidence = 'Low' | 'Medium' | 'High';

export type ParsedItem = {
  index: number;
  rawRow: string;
  detectedCode: string | null;
  detectedGrade: number | null;
  detectedStatus: string | null;
  detectedApprovalMethod: string | null;
  detectedYear: number | null;
  detectedTermNumber: number | null;
  subjectId: string | null;
  subjectName: string | null;
  termId: string | null;
  termLabel: string | null;
  confidence: ParseConfidence;
  issues: string[];
};

export type HistorialImportSummary = {
  totalDetected: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
};

export type HistorialImportPayload = {
  items: ParsedItem[];
  summary: HistorialImportSummary;
};

export type HistorialImportResponse = {
  id: string;
  sourceType: 'Pdf' | 'Text';
  status: HistorialImportStatus;
  error: string | null;
  payload: HistorialImportPayload | null;
  createdAt: string;
  parsedAt: string | null;
  confirmedAt: string | null;
};

export type CreateHistorialImportResponse = {
  id: string;
  status: HistorialImportStatus;
};

export type ConfirmHistorialImportResponse = {
  id: string;
  createdCount: number;
  skippedCount: number;
};

/**
 * Item editable que el user envía al confirm. Mismo shape que el ConfirmedItem
 * del backend.
 */
export type ConfirmedItem = {
  subjectId: string;
  termId: string | null;
  status: string;
  approvalMethod: string | null;
  grade: number | null;
};

/**
 * Estado del action de upload. Sigue el contrato de otros features.
 */
export type UploadHistorialState =
  | { status: 'idle' }
  | { status: 'success'; importId: string }
  | { status: 'error'; message: string };

export const initialUploadHistorialState: UploadHistorialState = { status: 'idle' };

export type ConfirmHistorialState = { status: 'idle' } | { status: 'error'; message: string };

export const initialConfirmHistorialState: ConfirmHistorialState = { status: 'idle' };
