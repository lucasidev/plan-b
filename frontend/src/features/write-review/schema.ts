import { z } from 'zod';

/**
 * Schema de lo que la pantalla Reseñar manda al backend (US-146, ADR-0082). Se comparte entre la
 * validación del cliente y el server action.
 *
 * Deliberadamente laxo con las respuestas: **saltear siempre vale**, así que no exige responder
 * ninguna frase en particular, solo al menos una (una reseña sin nada respondido no aporta a ningún
 * conteo y es una sesión abandonada). Qué frase existe y qué opción le pertenece lo valida el
 * backend contra el catálogo, que es el único que lo sabe.
 */

/**
 * El tope del campo libre: lo usa este schema y el `maxLength` del textarea en `review-form.tsx`
 * (con el texto que lo avisa debajo), para que no se desincronicen. El backend tiene su propia
 * constante (`Review.MaxFreeTextLength`) por diseño: no hay una fuente compartida cross-stack.
 */
export const FREE_TEXT_MAX_LENGTH = 2000;

export const courseReviewSchema = z.object({
  subjectId: z.string().uuid('Elegí la materia que cursaste.'),
  termId: z.string().uuid('Elegí cuándo la cursaste.'),
  chairId: z.string().uuid().nullable(),
  answers: z.record(z.string(), z.number().int()).refine((a) => Object.keys(a).length > 0, {
    message: 'Contestá al menos una pregunta.',
  }),
  freeText: z.string().max(FREE_TEXT_MAX_LENGTH, 'El texto es demasiado largo.').nullable(),
});

export type ReviewPayload = z.infer<typeof courseReviewSchema>;
