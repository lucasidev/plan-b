import { z } from 'zod';

/**
 * Schema de lo que la pantalla Reseñar manda al backend (US-146, ADR-0082). Se comparte entre la
 * validación del cliente y el server action.
 *
 * Deliberadamente laxo con las respuestas: **saltear siempre vale**, así que no exige responder
 * ningún ítem en particular, solo al menos uno (una reseña sin nada respondido no aporta a ningún
 * conteo y es una sesión abandonada). Qué ítem existe y qué opción le pertenece lo valida el
 * backend contra el catálogo, que es el único que lo sabe.
 */
export const courseReviewSchema = z.object({
  subjectId: z.string().uuid('Elegí la materia que cursaste.'),
  termId: z.string().uuid('Elegí cuándo la cursaste.'),
  chairId: z.string().uuid().nullable(),
  answers: z.record(z.string(), z.number().int()).refine((a) => Object.keys(a).length > 0, {
    message: 'Contestá al menos una pregunta.',
  }),
  freeText: z.string().max(2000, 'El texto es demasiado largo.').nullable(),
});

export type ReviewPayload = z.infer<typeof courseReviewSchema>;
