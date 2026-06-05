/**
 * DTOs for the US-088 backend. Mirror exactly the shape Academic serializes.
 */

export type CareerPlanImportStatus = 'Pending' | 'Parsing' | 'Parsed' | 'Failed' | 'Approved';

export type ParseConfidence = 'Low' | 'Medium' | 'High';

export type ParsedSubjectItem = {
  index: number;
  rawRow: string;
  detectedCode: string | null;
  detectedName: string | null;
  detectedYearInPlan: number | null;
  detectedTermInYear: number | null;
  detectedTermKind: string | null;
  confidence: ParseConfidence;
  issues: string[];
};

export type CareerPlanImportSummary = {
  totalDetected: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
};

export type CareerPlanImportPayload = {
  items: ParsedSubjectItem[];
  summary: CareerPlanImportSummary;
};

export type CareerPlanImportResponse = {
  id: string;
  universityId: string;
  careerName: string;
  planYear: number;
  studentEnrollmentYear: number;
  sourceType: 'Pdf' | 'Text';
  status: CareerPlanImportStatus;
  error: string | null;
  approvedCareerPlanId: string | null;
  payload: CareerPlanImportPayload | null;
  createdAt: string;
  parsedAt: string | null;
  approvedAt: string | null;
};

export type CreateCareerPlanImportResponse = {
  id: string;
  status: CareerPlanImportStatus;
};

export type ApproveCareerPlanImportResponse = {
  careerPlanId: string;
  careerId: string;
  subjectCount: number;
};

/**
 * Item the student sends when confirming the preview. Same shape as the backend's
 * ApproveSubjectItem.
 */
export type ApproveSubjectItem = {
  code: string;
  name: string;
  yearInPlan: number;
  termInYear: number | null;
  termKind: string;
};

export type UploadCareerPlanState =
  | { status: 'idle' }
  | { status: 'success'; importId: string }
  | { status: 'error'; message: string };

export const initialUploadCareerPlanState: UploadCareerPlanState = { status: 'idle' };

export type ApproveCareerPlanState =
  | { status: 'idle' }
  | { status: 'success'; careerPlanId: string; careerId: string; subjectCount: number }
  | { status: 'error'; message: string };

export const initialApproveCareerPlanState: ApproveCareerPlanState = { status: 'idle' };
