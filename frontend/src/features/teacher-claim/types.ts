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
  createdAt: string;
};

/** Estado del server action de iniciar claim. Vive en types (no en actions.ts: ese solo exporta async). */
export type ClaimFormState =
  | { status: 'idle' }
  | { status: 'success'; teacherId: string }
  | { status: 'error'; message: string };

export const initialClaimState: ClaimFormState = { status: 'idle' };
