import { z } from 'zod';

/** Las tres capas de la reseña. Espeja `ItemLayer` del backend. */
export const ITEM_LAYERS = ['Context', 'ChairConduct', 'StudentExperience'] as const;

/** De qué habla la pregunta: de la cátedra o de la materia. Espeja `ItemSubject`. */
export const ITEM_SUBJECTS = ['Chair', 'Subject'] as const;

/**
 * La valencia decide qué se pinta con el color de alarma en la ficha, y por eso se elige acá y no
 * al responder: la recolección va sin alarma (ADR-0071).
 */
export const OPTION_VALENCES = ['None', 'Positive', 'Neutral', 'Negative'] as const;

const option = z.object({
  value: z.coerce.number().int().min(1),
  order: z.coerce.number().int().min(1),
  label: z.string().trim().min(1, 'Cada opción necesita su etiqueta.').max(80),
  valence: z.enum(OPTION_VALENCES),
});

/**
 * Destilar una pregunta (ADR-0084). El mínimo de dos opciones lo impone el dominio y se repite acá
 * para que un pedido incompleto se corte antes de salir del browser.
 */
export const distilItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'La pregunta necesita un código.')
    .max(60)
    .regex(/^[A-Za-z0-9_]+$/, 'El código lleva letras, números y guiones bajos.'),
  text: z.string().trim().min(1, 'Escribí la pregunta.').max(200),
  help: z.string().trim().max(500).optional(),
  layer: z.enum(ITEM_LAYERS),
  subject: z.enum(ITEM_SUBJECTS),
  options: z.array(option).min(2, 'Una pregunta necesita al menos dos opciones.'),
});

export type DistilItemInput = z.infer<typeof distilItemSchema>;
