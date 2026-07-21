import { z } from 'zod';

export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Schema for the upload form. The student picks a university (preselected from
 * onboarding step 2), career name, plan year, enrollment year, and uploads a PDF or
 * pastes text.
 */
export const uploadCareerPlanSchema = z.object({
  universityId: z.string().uuid({ message: 'Universidad inválida.' }),
  careerName: z.string().min(1, 'Indicá el nombre de tu carrera.').max(200),
  planYear: z.coerce
    .number()
    .int()
    .min(1990, 'El año del plan está fuera de rango.')
    .max(new Date().getFullYear()),
  studentEnrollmentYear: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
});

export type UploadCareerPlanInput = z.infer<typeof uploadCareerPlanSchema>;

/**
 * Schema for the editable preview item. The backend re-validates each one; here we only
 * gate the obvious cases.
 */
export const approveSubjectItemSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  yearInPlan: z.coerce.number().int().min(1).max(10),
  termInYear: z.coerce.number().int().min(1).max(6).nullable(),
  termKind: z.enum(['FourMonth', 'FullYear', 'SixMonth', 'TwoMonth']),
});

export type ApproveSubjectItemInput = z.infer<typeof approveSubjectItemSchema>;
