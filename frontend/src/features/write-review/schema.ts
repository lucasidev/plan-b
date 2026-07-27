import { z } from 'zod';

/**
 * Review editor schema (US-049). ADR-0041 model (post-claude-design):
 *
 *  - Overall rating 1..5 stars (required).
 *  - Difficulty 1..5 steps (required).
 *  - Hours/week 0..20 (optional). The mockup caps at 20 (not 30 as the doc states),
 *    because going over 20 hs/week outside class is an outlier and the slider stays legible.
 *  - Two text axes, 50..2000 chars each when present, mirroring the backend `ReviewText` value
 *    object. `text` is about the course and stays required in write mode (the editor gates the
 *    Publish button on it); `teacherText` is about the teacher and is optional.
 *
 *    Both are optional in the schema so edit mode (which loads the persisted values) and partial
 *    drafts type-check without a sentinel. The aggregate only demands that at least one be present,
 *    which the required course text already satisfies.
 *
 *    `teacherText` used to be hardcoded to null on publish, so the column existed and nobody could
 *    write it: the teacher page ended up rendering the course text as if it were about the person.
 *  - Tags (optional, subset of the allowed set). The initial set lives in `mocks.ts` and is
 *    only an example; the definitive taxonomy lands in a separate US.
 *  - wouldRecommendCourse / wouldRetakeTeacher (required, default true to nudge the
 *    happy path; the student has to tap to say "No").
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
  // Min/max alineados con el ReviewText del backend (50..2000). Optional para que un draft vacío
  // o el modo edit type-cheen; el mínimo de 50 se valida sólo cuando hay texto (refine), y el botón
  // de publicar exige el texto en write mode (ver review-editor + actions).
  text: z
    .string()
    .trim()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .refine((v) => v === undefined || v.length >= 50, { message: 'Mínimo 50 caracteres' }),
  // Mismo rango y mismas reglas que `text`: es el otro eje del mismo value object del backend.
  teacherText: z
    .string()
    .trim()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .refine((v) => v === undefined || v.length >= 50, { message: 'Mínimo 50 caracteres' }),
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
  teacherText: undefined,
  tags: [],
  wouldRecommendCourse: true,
  wouldRetakeTeacher: true,
};
