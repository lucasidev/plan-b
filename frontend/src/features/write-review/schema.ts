import { z } from 'zod';

/**
 * Schema del editor de reseña (US-049). Modelo de ADR-0041 (post-claude-design):
 *
 *  - Rating general 1..5 estrellas (requerido).
 *  - Dificultad 1..5 steps (requerido).
 *  - Horas/semana 0..20 (opcional). El mockup limita a 20 (no 30 como dice el doc),
 *    porque pasar de 20 hs/sem fuera de clase es outlier y el slider se mantiene legible.
 *  - Texto libre (opcional, sin mínimo, max 4000 chars).
 *  - Tags (opcional, subset de los allowed). El set inicial está en `mocks.ts` y es ejemplo;
 *    la taxonomy definitiva aterriza en otra US.
 *  - wouldRecommendCourse / wouldRetakeTeacher (requeridos, default true para empujar al
 *    happy path; el alumno tiene que tocar para decir "No").
 *
 * Backend rework pendiente: el `POST /api/reviews` actual (US-017) NO acepta varios de
 * estos campos. Esta UI funciona contra mock hasta que la US del backend rework aterrice.
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
 * Valor inicial del form. Rating y difficulty arrancan en 0 (no seleccionados, fuerzan al
 * usuario a tocar). hoursPerWeek arranca en 8 (mediano del mockup). Recomendaciones en
 * true por default (happy path).
 */
export const REVIEW_FORM_DEFAULTS: ReviewFormInput = {
  rating: 0 as unknown as 1, // Sentinel "no elegido"; la validación bloquea el submit.
  difficulty: 0 as unknown as 1,
  hoursPerWeek: 8,
  text: undefined,
  tags: [],
  wouldRecommendCourse: true,
  wouldRetakeTeacher: true,
};
