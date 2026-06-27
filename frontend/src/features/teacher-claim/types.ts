/**
 * DTOs del flow de claim docente (US-030). `TeacherClaim` espeja el `TeacherClaimItem` del backend
 * (GET /api/me/teacher-claims).
 */
export type TeacherClaim = {
  claimId: string;
  teacherId: string;
  teacherName: string;
  teacherTitle: string | null;
  isVerified: boolean;
  /** Email institucional ingresado (US-031). Null = pendiente sin arrancar; set + !verified = mail enviado. */
  institutionalEmail: string | null;
  createdAt: string;
};

/** Estado conceptual de un claim derivado de sus campos (espeja verification-flows.md). */
export type ClaimState = 'pending' | 'email_pending' | 'verified';

export function claimState(claim: TeacherClaim): ClaimState {
  if (claim.isVerified) return 'verified';
  if (claim.institutionalEmail) return 'email_pending';
  return 'pending';
}

/** Estado del server action de iniciar claim. Vive en types (no en actions.ts: ese solo exporta async). */
export type ClaimFormState =
  | { status: 'idle' }
  | { status: 'success'; teacherId: string }
  | { status: 'error'; message: string };

export const initialClaimState: ClaimFormState = { status: 'idle' };

/** Estado del server action de enviar el email institucional (US-031 paso 1). */
export type EmailFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const initialEmailState: EmailFormState = { status: 'idle' };

/** Resultado de consumir el token de verificación (US-031 paso 2). */
export type VerifyResult =
  | { status: 'success' }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string };
