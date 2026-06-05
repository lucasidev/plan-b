import { z } from 'zod';

/**
 * Review editor schema (US-049). ADR-0041 model (post-claude-design):
 *
 *  - Overall rating 1..5 stars (required).
 *  - Difficulty 1..5 steps (required).
 *  - Hours/week 0..20 (optional). The mockup caps at 20 (not 30 as the doc states),
 *    because going over 20 hs/week outside class is an outlier and the slider stays legible.
 *  - Free text (optional, no minimum, max 4000 chars).
 *  - Tags (optional, subset of the allowed set). The initial set lives in `mocks.ts` and is
 *    only an example; the definitive taxonomy lands in a separate US.
 *  - wouldRecommendCourse / wouldRetakeTeacher (required, default true to nudge the
 *    happy path; the student has to tap to say "No").
 *
 * Pending backend rework: the current `POST /api/reviews` (US-017) does NOT accept several
 * of these fields. This UI works against a mock until the backend rework US lands.
 */
export const reviewFormSchema = z.object({
  rating: z
    .number()
    .int('Tiene que ser un número entero')
    .min(1, 'Elegí una calificación')
    .max(5, 'Máximo 5'),
  difficulty: z
    .number()
    .int('Tiene que ser un número entero')
    .min(1, 'Elegí una dificultad')
    .max(5, 'Máximo 5'),
  hoursPerWeek: z
    .number()
    .int('Tiene que ser un número entero')
    .min(0, 'Mínimo 0')
    .max(20, 'Máximo 20')
    .optional(),
  text: z
    .string()
    .trim()
    .max(4000, 'Máximo 4000 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  tags: z.array(z.string().min(1)).max(12, 'Máximo 12 etiquetas').default([]),
  wouldRecommendCourse: z.boolean(),
  wouldRetakeTeacher: z.boolean(),
});

export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

/**
 * Form initial value. Rating and difficulty start at 0 (unselected, force the user to
 * tap). hoursPerWeek starts at 8 (median in the mockup). Recommendations default to
 * true (happy path).
 */
export const REVIEW_FORM_DEFAULTS: ReviewFormInput = {
  rating: 0 as unknown as 1, // "Unset" sentinel; validation blocks the submit.
  difficulty: 0 as unknown as 1,
  hoursPerWeek: 8,
  text: undefined,
  tags: [],
  wouldRecommendCourse: true,
  wouldRetakeTeacher: true,
};
