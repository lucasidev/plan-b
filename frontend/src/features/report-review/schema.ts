import { z } from 'zod';

/**
 * Report payload schema (US-019). Shared between the modal (client gate) and the server
 * action. Reason must be one of the five backend enum values; details optional, max 2000
 * (matches the backend domain invariant).
 */
export const reportReviewSchema = z.object({
  reason: z.enum(['OffTopic', 'DatosPersonales', 'LenguajeInapropiado', 'Difamacion', 'Spam']),
  details: z
    .string()
    .trim()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
