/**
 * DTOs for the US-014 backend (POST/GET/POST confirm of /api/me/transcript-imports).
 * Mirror exactly the shape the backend serializes (camelCase via JsonOptions).
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
 * Editable item the user sends on confirm. Same shape as the backend's ConfirmedItem.
 */
export type ConfirmedItem = {
  subjectId: string;
  termId: string | null;
  status: string;
  approvalMethod: string | null;
  grade: number | null;
};

/**
 * State of the upload action. Follows the contract from other features.
 */
export type UploadHistorialState =
  | { status: 'idle' }
  | { status: 'success'; importId: string }
  | { status: 'error'; message: string };

export const initialUploadHistorialState: UploadHistorialState = { status: 'idle' };

export type ConfirmHistorialState = { status: 'idle' } | { status: 'error'; message: string };

export const initialConfirmHistorialState: ConfirmHistorialState = { status: 'idle' };
